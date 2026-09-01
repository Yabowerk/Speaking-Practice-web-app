FROM node:22-slim

WORKDIR /app

# Install ONLY ffmpeg and git (skips heavy C/C++ compilers)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    git \
    curl \
    ca-certificates \
    build-essential \
    cmake \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

ENV WHISPER_CUBLAS=0
ENV CMAKE_ARGS="-DGGML_NATIVE=OFF -DGGML_AVX=OFF -DGGML_AVX2=OFF -DGGML_FMA=OFF -DGGML_F16C=OFF"

RUN npm ci

RUN ffmpeg -f lavfi -i anullsrc=r=16000:cl=mono -t 1 -y /tmp/warmup.wav && \
    node -e "require('nodejs-whisper').nodewhisper('/tmp/warmup.wav', { modelName: 'base.en', autoDownloadModelName: 'base.en' }).then(() => console.log('Warm-up transcription complete')).catch((err) => { console.error(err); process.exit(1); })"

COPY . .
RUN mkdir -p uploads

EXPOSE 3000
CMD ["node", "server.js"]