# Use Python 3.10 slim image as base
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy all necessary files
COPY plantapi.py .
COPY plant_disease_dataset.json .
COPY plant_disease_1.h5 .

# Copy static files and build directory if they exist
COPY build/ ./build/
COPY static/ ./static/

# Expose port 7860 (Hugging Face Spaces default)
EXPOSE 7860

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Run the FastAPI application with uvicorn
CMD ["uvicorn", "plantapi:app", "--host", "0.0.0.0", "--port", "7860"]
