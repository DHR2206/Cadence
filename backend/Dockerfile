FROM python:3.11-slim

WORKDIR /workspace

# Copy requirements and install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source and modeling engine
COPY backend/app ./app
COPY models ./models

# Set PYTHONPATH so FastAPI can resolve import models.planner
ENV PYTHONPATH=/workspace

EXPOSE 8080

# Run Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
