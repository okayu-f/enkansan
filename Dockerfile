# ビルドステージ
FROM node:20-alpine AS build

# フロントエンドのディレクトリをワークディレクトリとして設定
WORKDIR /app/frontend

# package.jsonとyarn.lockをコピー
COPY frontend/package.json frontend/yarn.lock ./

# 依存関係のインストール
RUN yarn install --frozen-lockfile

# フロントエンドのソースコードをコピー
COPY frontend .

# ビルドを実行
RUN yarn build

# Pythonステージ
FROM python:3.11-slim
ENV ENV=production

WORKDIR /app

# システムの依存関係をインストール
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Pythonの依存関係をインストール
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# フロントエンドのビルド結果をコピー
COPY --from=build /app/frontend/dist ./frontend/dist

# バックエンドのコードをコピー
COPY backend .

# セキュリティのため、非root ユーザーを作成
RUN useradd -m myuser
USER myuser

# Gunicornを使用してアプリケーションを実行
CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "main:app", "--bind", "0.0.0.0:8080"]

# ヘルスチェック
HEALTHCHECK CMD curl --fail http://localhost:8080/health || exit 1
