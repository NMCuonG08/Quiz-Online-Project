FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN addgroup --system app && adduser --system --ingroup app app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY services ./services
COPY mcp ./mcp
COPY scripts ./scripts

USER app

EXPOSE 8000

CMD ["uvicorn", "services.main:app", "--host", "0.0.0.0", "--port", "8000"]
