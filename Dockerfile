# Use python:3.11-slim
FROM python:3.11-slim

# Install system dependencies for Tesseract OCR and OpenCV (headless)
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-eng \
    libtesseract-dev \
    libgl1-mesa-glx \
    libglib2.0-0 \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install pip requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project code
COPY . .

# Run static files collection
RUN python manage.py collectstatic --noinput

# Run the app via gunicorn on the port specified by Render (usually 10000)
CMD ["gunicorn", "wealthpass.wsgi:application", "--bind", "0.0.0.0:10000"]
