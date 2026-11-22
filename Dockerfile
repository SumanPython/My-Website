FROM node:20-slim

# Install LibreOffice Writer (headless) and fonts for clean PDF rendering
RUN apt-get update && \
    apt-get install -y --no-install-recommends libreoffice-writer fonts-dejavu && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 3000
CMD ["node", "server.js"]