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
RUN npm ci

COPY . .
RUN mkdir -p uploads

EXPOSE 3000
CMD ["node", "server.js"]