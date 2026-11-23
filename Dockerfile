# Use official lightweight Node.js 18 image on Debian slim
FROM node:18-slim

# Install comprehensive system-level binaries for all 12 PDF tools and future OCR:
# - libreoffice: Word (.docx) to PDF conversions (#8)
# - ghostscript: High-end vector PDF compression (#1) & rendering
# - qpdf: Fast structural PDF manipulation, protection (#11), unlocking (#12), rotation (#10), and splitting (#7)
# - imagemagick: Image-to-PDF / PDF-to-JPG rendering support (#2, #5)
# - tesseract-ocr & language packs: Future-proofing for OCR Text Extraction (#4)
# - poppler-utils: PDF text inspection and rendering utilities
# - curl & git: Essential build utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice \
    ghostscript \
    qpdf \
    imagemagick \
    tesseract-ocr \
    tesseract-ocr-eng \
    poppler-utils \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set working directory inside the container
WORKDIR /app

# Copy package manifests first to optimize Docker layer caching
COPY package*.json ./

# Install all Node.js project dependencies
RUN npm install

# Copy the rest of the application source code into the container
COPY . .

# Expose the application port
EXPOSE 3000

# Set environment variables for production execution
ENV NODE_ENV=production

# Start the Node.js application server
CMD ["node", "server.js"]