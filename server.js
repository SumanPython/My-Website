const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { PDFDocument } = require('pdf-lib');
const JSZip = require('jszip');
const pdfParse = require('pdf-parse');

const app = express();
const PORT = process.env.PORT || 3000;

const uploadDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'outputs');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const upload = multer({ dest: uploadDir });

app.use(express.static(path.join(__dirname)));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/ffmpeg', express.static(path.join(__dirname, 'node_modules/@ffmpeg/ffmpeg/dist/umd')));
app.use('/ffmpeg-util', express.static(path.join(__dirname, 'node_modules/@ffmpeg/util/dist/umd')));
app.use('/ffmpeg-core', express.static(path.join(__dirname, 'node_modules/@ffmpeg/core/dist/umd')));

app.post('/merge', upload.array('pdfFiles'), async (req, res) => {
    if (!req.files || req.files.length < 2) {
        if (req.files) {
            req.files.forEach(file => fs.unlink(file.path, () => {}));
        }
        return res.status(400).json({ error: 'Please upload at least 2 PDF files to merge.' });
    }

    try {
        const mergedPdf = await PDFDocument.create();
        const firstWords = [];

        for (const file of req.files) {
            const fileBytes = fs.readFileSync(file.path);
            
            // Extract the first word from the PDF text content
            try {
                const pdfData = await pdfParse(fileBytes);
                if (pdfData && pdfData.text) {
                    const cleanedText = pdfData.text.trim().replace(/[\r\n]+/g, ' ');
                    const firstWord = cleanedText.split(/\s+/)[0];
                    if (firstWord) {
                        const sanitizedWord = firstWord.replace(/[^a-zA-Z0-9-_]/g, '');
                        if (sanitizedWord) firstWords.push(sanitizedWord);
                    }
                }
            } catch (parseErr) {
                console.warn('Could not parse text for filename, skipping word:', parseErr);
            }

            const pdfDoc = await PDFDocument.load(fileBytes);
            const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }

        const mergedPdfBytes = await mergedPdf.save();
        const outputFileName = `merged-${Date.now()}.pdf`;
        const outputPath = path.join(outputDir, outputFileName);

        fs.writeFileSync(outputPath, mergedPdfBytes);

        // --- CONCATENATE FIRST WORDS FOR FILENAME ---
        let downloadName = firstWords.length > 0 
            ? `${firstWords.join('-and-')}-merged.pdf` 
            : `merged-document.pdf`;
        // ---------------------------------------------

        // Expose Content-Disposition header so browser fetch can read it
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

        res.download(outputPath, downloadName, () => {
            req.files.forEach(file => fs.unlink(file.path, () => {}));
            fs.unlink(outputPath, () => {});
        });

    } catch (error) {
        console.error('Merge error:', error);
        req.files.forEach(file => fs.unlink(file.path, () => {}));
        return res.status(500).json({ error: 'Failed to merge PDFs. One of the files may be corrupted or password-protected.' });
    }
});

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

app.post('/compress', upload.single('pdfFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Please upload a PDF file to compress.' });
    }

    const compressionLevel = (req.body.level || 'recommended').toLowerCase();
    const inputPath = req.file.path;
    const outputFileName = `compressed-${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, outputFileName);

    const levelSettings = {
        low: { preset: '/printer', dpi: 150, jpegQ: 80 },
        recommended: { preset: '/ebook', dpi: 96, jpegQ: 50 },
        high: { preset: '/screen', dpi: 72, jpegQ: 35 }
    };

    const config = levelSettings[compressionLevel] || levelSettings.recommended;
    const gsCommand = process.platform === 'win32' ? 'gswin64c' : 'gs';

    const gsArgs = [
        '-sDEVICE=pdfwrite',
        '-dCompatibilityLevel=1.4',
        `-dPDFSETTINGS=${config.preset}`,
        '-dNOPAUSE',
        '-dQUIET',
        '-dBATCH',
        '-dDownsampleColorImages=true',
        '-dDownsampleGrayImages=true',
        '-dDownsampleMonoImages=true',
        '-dColorImageDownsampleThreshold=1.0',
        '-dGrayImageDownsampleThreshold=1.0',
        '-dMonoImageDownsampleThreshold=1.0',
        '-dColorImageDownsampleType=/Bicubic',
        '-dGrayImageDownsampleType=/Bicubic',
        '-dMonoImageDownsampleType=/Subsample',
        `-dColorImageResolution=${config.dpi}`,
        `-dGrayImageResolution=${config.dpi}`,
        `-dMonoImageResolution=${config.dpi}`,
        '-dAutoFilterColorImages=false',
        '-dAutoFilterGrayImages=false',
        '-dColorImageFilter=/DCTEncode',
        '-dGrayImageFilter=/DCTEncode',
        `-dJPEGQ=${config.jpegQ}`,
        '-dCompressFonts=true',
        '-dSubsetFonts=true',
        '-dDetectDuplicateImages=true',
        `-sOutputFile=${outputPath}`,
        inputPath
    ];

    execFile(gsCommand, gsArgs, (error) => {
        if (error) {
            console.error('Ghostscript compression error:', error);
            if (fs.existsSync(inputPath)) fs.unlink(inputPath, () => {});
            if (fs.existsSync(outputPath)) fs.unlink(outputPath, () => {});
            return res.status(500).json({ error: 'Unable to compress PDF. It may be encrypted or corrupted.' });
        }

        if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
            if (fs.existsSync(inputPath)) fs.unlink(inputPath, () => {});
            return res.status(500).json({ error: 'Compression failed to generate output file.' });
        }

        const originalSize = fs.statSync(inputPath).size;
        const compressedSize = fs.statSync(outputPath).size;

        const finalPath = compressedSize < originalSize ? outputPath : inputPath;

        res.download(finalPath, 'compressed-document.pdf', () => {
            if (fs.existsSync(inputPath)) fs.unlink(inputPath, () => {});
            if (fs.existsSync(outputPath)) fs.unlink(outputPath, () => {});
        });
    });
});

app.listen(PORT, () => {
    console.log('Server is running on http://localhost:' + PORT);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('Server is running on http://localhost:' + PORT);
});