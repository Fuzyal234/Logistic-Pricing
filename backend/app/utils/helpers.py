import time


# decorator for time
def time_decorator(func):
    def wrapper(*args, **kwargs):
        start_time = time.time()
        print(f"Calling Function:   {func.__name__}")
        result = func(*args, **kwargs)
        end_time = time.time()
        print(
            f"Function End:       {func.__name__} | Time taken: {end_time - start_time} seconds"
        )
        return result

    return wrapper
