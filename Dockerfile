FROM node:18-slim

# Install LibreOffice (for Word-to-PDF) and Ghostscript (for true vector PDF compression)
RUN apt-get update && apt-get install -y \
    libreoffice \
    ghostscript \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]