# Use an official lightweight Python image
FROM python:3.13

# Set working directory
WORKDIR /plantapi

# Install system dependencies (for TensorFlow)
RUN apt-get update && apt-get install -y libgl1-mesa-glx

# Copy backend
COPY . .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose port for Hugging Face
EXPOSE 7860

# Run FastAPI app
CMD ["uvicorn", "plantapi:app", "--host", "0.0.0.0", "--port", "10000"]
