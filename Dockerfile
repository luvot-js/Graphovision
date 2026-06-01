# Railway 배포용 Dockerfile (프로젝트 루트 기준)
# 빌드 컨텍스트: 프로젝트 루트 전체
# → best_model.pth, model.py, feature_extractor.py 포함 가능

FROM python:3.11-slim

WORKDIR /project

# 시스템 패키지 (OpenCV headless용)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 libgl1 \
    && rm -rf /var/lib/apt/lists/*

# 의존성 먼저 설치 (캐시 활용)
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# 백엔드 코드
COPY backend/ ./backend/

# 루트 레벨 AI 파일 (inference.py가 ROOT = /project 로 접근)
COPY model.py feature_extractor.py best_model.pth ./

# 업로드 디렉토리
RUN mkdir -p data/uploads

WORKDIR /project/backend

EXPOSE 8000

# Railway는 $PORT 환경변수를 주입함
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
