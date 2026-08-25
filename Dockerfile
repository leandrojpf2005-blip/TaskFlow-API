# Start from a slim official Python image matching your version (3.13).
FROM python:3.13-slim

# Everything runs inside /app in the container.
WORKDIR /app

# Copy ONLY requirements first, then install. This is a caching trick:
# Docker caches this layer, so it re-installs deps only when requirements.txt
# changes — not every time you edit your code.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Now copy your application code.
COPY app/ ./app/

# Run the server. --host 0.0.0.0 is REQUIRED in a container: the default
# 127.0.0.1 would only be reachable from *inside* the container, not from outside.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
