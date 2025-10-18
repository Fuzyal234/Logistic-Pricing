import logging
import math
from itertools import combinations

from app.core.supabase_client import get_supabase_client
from app.schemas.product_sourcing import ProductSourcingRequest
from app.utils.helpers import time_decorator

logger = logging.getLogger(__name__)


class ProductSourcingService:
    """Product sourcing service"""

    def __init__(self) -> None:
        self.client = get_supabase_client()

    @time_decorator
    def update_products_with_suppliers(
        self, request: ProductSourcingRequest
    ) -> list[dict]:
        """Update products with suppliers"""

        updated_products = []

        sku_dict = {
            sku_object.sku_uuid: sku_object.quantity
            for sku_object in request.sku_object_list
        }

        products = (
            self.client.table("products")
            .select(
                "product_id, pieces_per_pallet, supplier_products_warehouse(supplier_id, warehouse_id, price, available_inventory)"
            )
            .in_("product_id", list(sku_dict.keys()))
            .execute()
            .data
        )

        for product in products:
            product_suppliers = product.pop("supplier_products_warehouse")
            updated_products.append(
                {
                    "sku_uuid": product["product_id"],
                    "quantity": sku_dict[product["product_id"]],
                    "suppliers": product_suppliers,
                    "product_details": product,
                }
            )
        return updated_products

    @time_decorator
    def find_routes(self, warehouse_id: str, distribution_center_id: str) -> list[dict]:
        """Find routes for a warehouse to a client"""
        return (
            self.client.table("routes")
            .select("*")
            .eq("warehouse_id", warehouse_id)
            .eq("distribution_center_id", distribution_center_id)
            .execute()
            .data
        )

    @time_decorator
    def find_route_quote(self, route_id: str) -> dict:
        """Find route quote for a route"""
        return (
            self.client.table("route_unit_quotes")
            .select("*")
            .eq("route_id", route_id)
            .execute()
        )

    def stars_and_bars_stream(self, length_of_suppliers: int, quantity: int):
        """
        Lazily generate all k-tuples (x1, ..., xk) such that
        x1 + x2 + ... + xk = n, using O(k) memory.
        """

        for bars in combinations(
            range(quantity + length_of_suppliers - 1), length_of_suppliers - 1
        ):
            # compute x_i values from bar positions
            prev = -1
            result = []
            for b in bars + (quantity + length_of_suppliers - 1,):
                result.append(b - prev - 1)
                prev = b
            yield result

    def map_suppliers_with_quantity(self, suppliers: list[dict], quantity: int):
        if len(suppliers) <= 0 or quantity <= 0:
            return []
        possible_combinations = list(
            self.stars_and_bars_stream(len(suppliers), quantity)
        )

        results = []
        for combination in possible_combinations:
            distribution = {
                supplier["supplier_id"]: combination[i]
                for i, supplier in enumerate(suppliers)
            }

            # check if supplier has enough available inventory
            for supplier in suppliers:
                if (
                    distribution[supplier["supplier_id"]]
                    > supplier["available_inventory"]
                ):
                    continue

            total_cost = sum(
                supplier["price"] * distribution[supplier["supplier_id"]]
                for supplier in suppliers
            )
            details = [
                {
                    "allocated_quantity": distribution[supplier["supplier_id"]],
                    "price": supplier["price"],
                    "available_inventory": supplier["available_inventory"],
                    "supplier_id": supplier["supplier_id"],
                    "warehouse_id": supplier["warehouse_id"],
                }
                for supplier in suppliers
                if distribution[supplier["supplier_id"]] > 0
            ]

            result = {
                "distribution": distribution,
                "total_cost": total_cost,
                "details": details,
            }
            results.append(result)

        sorted_results = sorted(results, key=lambda x: x["total_cost"])

        return sorted_results

    @time_decorator
    def update_routes_with_quotes(self, routes: list[dict]):
        for route in routes:
            route_quotes = self.find_route_quote(route["route_id"])
            route["route_quotes"] = route_quotes.data

    def find_combinations_of_quotes(
        self, route_quotes: list[dict], pallets: int
    ) -> list[dict]:
        if len(route_quotes) <= 0 or pallets <= 0:
            return []
        possible_combinations = list(
            self.stars_and_bars_stream(len(route_quotes), pallets)
        )

        results = []
        for combination in possible_combinations:
            distribution = {
                f"{route_quote['route_id']}-{route_quote['unit_id']}-{route_quote['logistics_supplier_id']}": combination[
                    i
                ]
                for i, route_quote in enumerate(route_quotes)
            }

            legs_mapper = {}

            # check if quote has enough available size, increase number of legs
            for quote in route_quotes:
                if (
                    distribution[
                        f"{quote['route_id']}-{quote['unit_id']}-{quote['logistics_supplier_id']}"
                    ]
                    > quote["max_pallets"]
                ):
                    # number of legs required
                    legs = math.ceil(
                        distribution[
                            f"{quote['route_id']}-{quote['unit_id']}-{quote['logistics_supplier_id']}"
                        ]
                    )
                    legs_mapper[
                        f"{quote['route_id']}-{quote['unit_id']}-{quote['logistics_supplier_id']}"
                    ] = legs

            total_cost = sum(
                quote["cost"]
                * distribution[
                    f"{quote['route_id']}-{quote['unit_id']}-{quote['logistics_supplier_id']}"
                ]
                * legs_mapper.get(
                    f"{quote['route_id']}-{quote['unit_id']}-{quote['logistics_supplier_id']}",
                    1,
                )
                for quote in route_quotes
            )
            details = [
                {
                    "allocated_quantity": distribution[
                        f"{quote['route_id']}-{quote['unit_id']}-{quote['logistics_supplier_id']}"
                    ],
                    "cost": quote["cost"],
                    "max_pallets": quote["max_pallets"],
                    "route_id": quote["route_id"],
                    "unit_id": quote["unit_id"],
                    "logistics_supplier_id": quote["logistics_supplier_id"],
                    "legs": legs_mapper.get(
                        f"{quote['route_id']}-{quote['unit_id']}-{quote['logistics_supplier_id']}",
                        1,
                    ),
                }
                for quote in route_quotes
                if distribution[
                    f"{quote['route_id']}-{quote['unit_id']}-{quote['logistics_supplier_id']}"
                ]
                > 0
            ]

            result = {
                "distribution": distribution,
                "total_cost": total_cost,
                "details": details,
            }
            results.append(result)

        sorted_results = sorted(results, key=lambda x: x["total_cost"])

        return sorted_results

    @time_decorator
    def update_supplier_allocations_with_route_quotes(
        self, allocations_per_product: dict[str, dict], distribution_center_uuid: str
    ):
        warehouse_ids = [
            allocation["warehouse_id"]
            for detail_object in allocations_per_product.values()
            for combination in detail_object["combinations"]
            for allocation in combination["details"]
            if allocation["allocated_quantity"] > 0
        ]
        routes_with_quotes = (
            self.client.rpc(
                "get_combinations",
                {
                    "warehouse_ids": warehouse_ids,
                    "distribution_center_id": distribution_center_uuid,
                },
            )
            .execute()
            .data
        )
        routes_with_quotes_mapper = {}
        for route in routes_with_quotes:
            routes_with_quotes_mapper[
                (route["warehouse_id"], route["distribution_center_id"])
            ] = routes_with_quotes_mapper.get(
                (route["warehouse_id"], route["distribution_center_id"]), []
            ) + [
                route
            ]
        return routes_with_quotes_mapper

    @time_decorator
    def process_route_allocations(
        self,
        allocations_per_product: dict[str, dict],
        distribution_center_uuid: str,
        routes_with_quotes_mapper: dict[tuple[str, str], list[dict]],
    ):
        for _, detail_object in allocations_per_product.items():
            for combination in detail_object["combinations"]:
                for allocation in combination["details"]:
                    if allocation["allocated_quantity"] == 0:
                        routes = []
                    else:
                        routes = routes_with_quotes_mapper.get(
                            (allocation["warehouse_id"], distribution_center_uuid), []
                        )
                        pieces_per_pallet = detail_object["product_details"][
                            "pieces_per_pallet"
                        ]

                        pallets_required = math.ceil(
                            allocation["allocated_quantity"] / pieces_per_pallet
                        )

                        # find combinations of quotes
                        for route in routes:
                            route["quote_combinations"] = (
                                self.find_combinations_of_quotes(
                                    route["quotes"],
                                    pallets_required,
                                )
                            )

                    allocation.update(
                        {
                            "routes": routes,
                            "quantity": allocation["allocated_quantity"],
                        }
                    )
        return allocations_per_product

    @time_decorator
    def aggregating_and_sorting_allocations(
        self, allocations_per_product: dict[str, dict]
    ):
        result = []
        for _, detail_object in allocations_per_product.items():
            object = {"product_id": detail_object["product_id"], "combinations": []}
            for combination in detail_object["combinations"]:
                combination_result = {
                    "total_cost": 0,
                    "product_cost": combination["total_cost"],
                    "logistics_cost": 0,
                    "supplier_allocations": [],
                }

                for allocation in combination["details"]:
                    if allocation["allocated_quantity"] == 0:
                        continue

                    cheapest_quote_combinations_per_route = []
                    for route in allocation["routes"]:
                        cheapest_quote_combination_per_route = (
                            route["quote_combinations"][0]
                            if route["quote_combinations"]
                            else None
                        )
                        if cheapest_quote_combination_per_route:
                            cheapest_quote_combinations_per_route.append(
                                cheapest_quote_combination_per_route
                            )

                    cheapest_quote_combination = None
                    if cheapest_quote_combinations_per_route:
                        cheapest_quote_combination = min(
                            cheapest_quote_combinations_per_route,
                            key=lambda x: x["total_cost"] if x else float("inf"),
                        )
                        combination_result["logistics_cost"] += (
                            cheapest_quote_combination["total_cost"]
                            if cheapest_quote_combination
                            else 0
                        )

                    combination_result["supplier_allocations"].append(
                        {
                            "supplier_id": allocation["supplier_id"],
                            "warehouse_id": allocation["warehouse_id"],
                            "quantity": allocation["allocated_quantity"],
                            "quote_combination": (
                                cheapest_quote_combination["details"]
                                if cheapest_quote_combination
                                else []
                            ),
                        }
                    )

                if combination_result["logistics_cost"] == 0:
                    continue

                combination_result["total_cost"] = (
                    combination_result["product_cost"]
                    + combination_result["logistics_cost"]
                )

                # Remove combination if quote combination is empty
                has_empty_quote_combination = False
                for supplier_allocation in combination_result["supplier_allocations"]:
                    if not supplier_allocation["quote_combination"]:
                        has_empty_quote_combination = True
                        break

                if has_empty_quote_combination:
                    continue

                object["combinations"].append(combination_result)

            if len(object["combinations"]) == 0:
                continue

            object["combinations"] = sorted(
                object["combinations"], key=lambda x: x["total_cost"]
            )
            object["combinations"] = object["combinations"][:5]
            result.append(object)

        return result

    @time_decorator
    def process_supplier_allocations(self, updated_products: list[dict]):
        allocations_per_product = {}
        for product in updated_products:
            allocations_per_product[product["sku_uuid"]] = {
                "product_id": product["sku_uuid"],
                "product_details": product["product_details"],
                "combinations": self.map_suppliers_with_quantity(
                    product["suppliers"], product["quantity"]
                ),
            }

        return allocations_per_product
