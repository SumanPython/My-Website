const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const JSZip = require('jszip');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup output and uploads directories if they don't exist
const uploadDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'outputs');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const upload = multer({ dest: uploadDir });

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// 1. Merge PDF Route
// ==========================================
app.post('/merge', upload.array('pdfFiles'), async (req, res) => {
    if (!req.files || req.files.length < 2) {
        if (req.files) {
            req.files.forEach(file => fs.unlink(file.path, () => {}));
        }
        return res.status(400).json({ error: 'Please upload at least 2 PDF files to merge.' });
    }

    try {
        const mergedPdf = await PDFDocument.create();

        for (const file of req.files) {
            const fileBytes = fs.readFileSync(file.path);
            const pdfDoc = await PDFDocument.load(fileBytes);
            const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }

        const mergedPdfBytes = await mergedPdf.save();
        const outputFileName = `merged-${Date.now()}.pdf`;
        const outputPath = path.join(outputDir, outputFileName);

        fs.writeFileSync(outputPath, mergedPdfBytes);

        res.download(outputPath, 'merged-document.pdf', () => {
            req.files.forEach(file => fs.unlink(file.path, () => {}));
            fs.unlink(outputPath, () => {});
        });

    } catch (error) {
        console.error('Merge error:', error);
        req.files.forEach(file => fs.unlink(file.path, () => {}));
        return res.status(500).json({ error: 'Failed to merge PDFs. One of the files may be corrupted or password-protected.' });
    }
});

// ==========================================
// 2. JPG to PDF Route (Individual PDFs in a ZIP)
// ==========================================
app.post('/jpg-to-pdf', upload.array('imageFiles'), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'Please upload at least one image file.' });
    }

    try {
        const zip = new JSZip();
        const createdFiles = [];

        for (const file of req.files) {
            const imageBytes = fs.readFileSync(file.path);
            const pdfDoc = await PDFDocument.create();
            let embeddedImage;

            if (file.mimetype === 'image/png' || file.originalname.toLowerCase().endsWith('.png')) {
                embeddedImage = await pdfDoc.embedPng(imageBytes);
            } else {
                embeddedImage = await pdfDoc.embedJpg(imageBytes);
            }

            const page = pdfDoc.addPage([embeddedImage.width, embeddedImage.height]);
            page.drawImage(embeddedImage, {
                x: 0,
                y: 0,
                width: embeddedImage.width,
                height: embeddedImage.height,
            });

            const pdfBytes = await pdfDoc.save();
            
            const baseName = path.basename(file.originalname, path.extname(file.originalname));
            const pdfFileName = `${baseName}-converted.pdf`;
            const individualOutputPath = path.join(outputDir, `${Date.now()}-${pdfFileName}`);

            fs.writeFileSync(individualOutputPath, pdfBytes);
            createdFiles.push({ path: individualOutputPath, name: pdfFileName });

            zip.file(pdfFileName, pdfBytes);
        }

        const zipContent = await zip.generateAsync({ type: 'nodebuffer' });
        const zipFileName = `converted-pdfs-${Date.now()}.zip`;
        const zipOutputPath = path.join(outputDir, zipFileName);

        fs.writeFileSync(zipOutputPath, zipContent);

        res.download(zipOutputPath, 'converted-images-pdfs.zip', () => {
            req.files.forEach(file => fs.unlink(file.path, () => {}));
            createdFiles.forEach(f => fs.unlink(f.path, () => {}));
            fs.unlink(zipOutputPath, () => {});
        });

    } catch (error) {
        console.error('JPG to PDF ZIP error:', error);
        req.files.forEach(file => fs.unlink(file.path, () => {}));
        return res.status(500).json({ error: 'Failed to convert images to individual PDFs.' });
    }
});

// ==========================================
// 3. Split PDF Route
// ==========================================
app.post('/split', upload.single('pdfFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Please upload a PDF file to split.' });
    }

    const splitMode = req.body.mode || 'all';

    try {
        const fileBytes = fs.readFileSync(req.file.path);
        const pdfDoc = await PDFDocument.load(fileBytes);
        const totalPages = pdfDoc.getPageCount();
        const zip = new JSZip();
        const createdFiles = [];

        if (splitMode === 'all') {
            for (let i = 0; i < totalPages; i++) {
                const subPdf = await PDFDocument.create();
                const [copiedPage] = await subPdf.copyPages(pdfDoc, [i]);
                subPdf.addPage(copiedPage);

                const subPdfBytes = await subPdf.save();
                const subFileName = `page-${i + 1}-split.pdf`;
                const subPath = path.join(outputDir, `${Date.now()}-${subFileName}`);

                fs.writeFileSync(subPath, subPdfBytes);
                createdFiles.push({ path: subPath, name: subFileName });
                zip.file(subFileName, subPdfBytes);
            }
        }

        const zipContent = await zip.generateAsync({ type: 'nodebuffer' });
        const zipFileName = `split-pdfs-${Date.now()}.zip`;
        const zipOutputPath = path.join(outputDir, zipFileName);

        fs.writeFileSync(zipOutputPath, zipContent);

        res.download(zipOutputPath, 'split-documents.zip', () => {
            fs.unlinkSync(req.file.path);
            createdFiles.forEach(f => fs.unlink(f.path, () => {}));
            fs.unlink(zipOutputPath, () => {});
        });

    } catch (error) {
        console.error('Split error:', error);
        if (req.file) fs.unlink(req.file.path, () => {});
        return res.status(500).json({ error: 'Failed to split PDF. The file may be password-protected or corrupted.' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});