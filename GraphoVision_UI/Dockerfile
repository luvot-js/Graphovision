FROM node:22-alpine

# pnpm 설치
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# 의존성 파일 복사 후 설치 (캐시 활용)
COPY package.json pnpm-workspace.yaml ./
RUN pnpm install

# 소스 코드 복사
COPY . .

EXPOSE 5173

# 외부 접속을 위해 --host 옵션 필요
CMD ["pnpm", "dev", "--host", "0.0.0.0"]
