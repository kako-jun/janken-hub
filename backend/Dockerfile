FROM python:3.11-slim

WORKDIR /app

# uvをインストール
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# 依存関係をコピー
COPY pyproject.toml uv.lock ./

# 依存関係をインストール
RUN uv sync --frozen

# アプリケーションコードをコピー
COPY app ./app

# ポート公開
EXPOSE 8080

# 起動コマンド
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
