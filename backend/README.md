# Logistical Pricing Backend

A FastAPI-based backend service for calculating logistical pricing with containerized deployment support.

## 🚀 Features

- **FastAPI Framework**: Modern, fast web framework for building APIs
- **Docker Support**: Fully containerized with Docker and Docker Compose
- **Pricing Calculations**: Calculate logistical pricing based on distance, weight, and service type
- **Health Checks**: Built-in health monitoring endpoints
- **API Documentation**: Automatic OpenAPI/Swagger documentation

## 📁 Project Structure

```
├── main.py                 # FastAPI application entry point
├── requirements.txt        # Python dependencies
├── Dockerfile             # Docker configuration
├── docker-compose.yml     # Docker Compose for easy deployment
├── .dockerignore          # Files to ignore in Docker build
└── app/
    ├── __init__.py        # Makes app a Python package
```

## 🛠️ Installation & Setup

### Prerequisites

- Python 3.13+
- Docker and Docker Compose (for containerized deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd logistical-pricing-backend
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   uvicorn main:app --reload
   ```

   The API will be available at `http://localhost:8000`

### Docker Deployment

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

2. **Run in background**
   ```bash
   docker-compose up -d
   ```

3. **Production deployment with Nginx**
   ```bash
   docker-compose --profile production up
   ```

## 📚 API Documentation

Once the application is running, you can access:

- **Interactive API Docs**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`
- **OpenAPI Schema**: `http://localhost:8000/openapi.json`

## 🔗 API Endpoints

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Welcome message |
| `GET` | `/health` | Health check endpoint |





## 🐳 Docker Commands

### Build and Run
```bash
# Build the Docker image
docker build -t logistical-pricing-backend .

# Run the container
docker run -p 8000:8000 logistical-pricing-backend
```

### Docker Compose
```bash
# Start services
docker-compose up

# Start in background
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild and start
docker-compose up --build
```

## 🔧 Configuration

### Environment Variables

The application supports the following environment variables:

- `PYTHONPATH`: Python path configuration (default: `/app`)
- `HOST`: Server host (default: `0.0.0.0`)
- `PORT`: Server port (default: `8000`)

### Pricing Configuration

Current pricing rates can be modified in `app/routes.py`:

- Base rate: $2.5 per km
- Weight rate: $0.1 per kg
- Service multipliers:
  - Standard: 1.0x
  - Express: 1.5x
  - Premium: 2.0x

## 🧪 Testing

### Health Check
```bash
curl http://localhost:8000/health
```

### API Testing
```bash
# Test pricing calculation
curl "http://localhost:8000/pricing/calculate?distance=50&weight=25&service_type=standard"

## 🚀 Production Deployment

For production deployment, use the nginx profile:

```bash
docker-compose --profile production up -d
```

This will:
- Run the FastAPI application
- Set up Nginx as a reverse proxy
- Expose the service on port 80
- Include health checks and proper logging

## 📝 Development

### Adding New Routes

1. Add new endpoints in `app/routes.py`
2. Import and include the router in `main.py`
3. Update this README with new endpoint documentation

### Code Style

- Follow PEP 8 guidelines
- Use type hints with Pydantic models
- Include docstrings for all endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please open an issue in the repository.

### Passing lints check
- pip install pre-commit
- pre-commit install
- pre-commit run trailing-whitespace --all-files
- pre-commit run end-of-file-fixer --all-files
- pre-commit run check-json --all-files
- pre-commit run check-toml --all-files
- pre-commit run check-xml --all-files
- pre-commit run check-yaml --all-files
- pre-commit run debug-statements --all-files
- pre-commit run check-builtin-literals --all-files
- pre-commit run check-case-conflict --all-files
- pre-commit run check-docstring-first --all-files
- pre-commit run detect-private-key --all-files
- pre-commit run black --all-files
- pre-commit run ruff-check --all-files
- pre-commit run ruff-format --all-files
