// // const express = require('express');
// // const multer = require('multer');
// // const fs = require('fs');
// // const path = require('path');
// // const { execFile } = require('child_process');
// // const { PDFDocument } = require('pdf-lib');
// // const JSZip = require('jszip');
// // const pdfParse = require('pdf-parse');

// // const app = express();
// // const PORT = process.env.PORT || 3000;

// // const uploadDir = path.join(__dirname, 'uploads');
// // const outputDir = path.join(__dirname, 'outputs');

// // if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
// // if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// // const upload = multer({ dest: uploadDir });

// // app.use(express.static(path.join(__dirname)));
// // app.use(express.json());
// // app.use(express.urlencoded({ extended: true }));

// // app.use('/ffmpeg', express.static(path.join(__dirname, 'node_modules/@ffmpeg/ffmpeg/dist/umd')));
// // app.use('/ffmpeg-util', express.static(path.join(__dirname, 'node_modules/@ffmpeg/util/dist/umd')));
// // app.use('/ffmpeg-core', express.static(path.join(__dirname, 'node_modules/@ffmpeg/core/dist/umd')));

// // // ======================================================
// // // MERGE PDF
// // // ======================================================

// // app.post('/merge', upload.array('pdfFiles'), async (req, res) => {
// //     if (!req.files || req.files.length < 2) {
// //         if (req.files) {
// //             req.files.forEach(file => fs.unlink(file.path, () => {}));
// //         }

// //         return res.status(400).json({
// //             error: 'Please upload at least 2 PDF files to merge.'
// //         });
// //     }

// //     let outputPath;

// //     try {
// //         const mergedPdf = await PDFDocument.create();
// //         const firstWords = [];

// //         for (const file of req.files) {
// //             const fileBytes = fs.readFileSync(file.path);

// //             // Extract the first word from each PDF for the download filename.
// //             try {
// //                 const pdfData = await pdfParse(fileBytes);

// //                 if (pdfData && pdfData.text) {
// //                     const cleanedText = pdfData.text.trim().replace(/[\r\n]+/g, ' ');
// //                     const firstWord = cleanedText.split(/\s+/)[0];

// //                     if (firstWord) {
// //                         const sanitizedWord = firstWord.replace(/[^a-zA-Z0-9-_]/g, '');

// //                         if (sanitizedWord) {
// //                             firstWords.push(sanitizedWord);
// //                         }
// //                     }
// //                 }
// //             } catch (parseErr) {
// //                 console.warn(
// //                     'Could not parse text for filename, skipping word:',
// //                     parseErr.message
// //                 );
// //             }

// //             const pdfDoc = await PDFDocument.load(fileBytes);
// //             const copiedPages = await mergedPdf.copyPages(
// //                 pdfDoc,
// //                 pdfDoc.getPageIndices()
// //             );

// //             copiedPages.forEach(page => mergedPdf.addPage(page));
// //         }

// //         const mergedPdfBytes = await mergedPdf.save();

// //         const outputFileName = `merged-${Date.now()}.pdf`;
// //         outputPath = path.join(outputDir, outputFileName);

// //         fs.writeFileSync(outputPath, mergedPdfBytes);

// //         const downloadName = firstWords.length > 0
// //             ? `${firstWords.join('-and-')}-merged.pdf`
// //             : 'merged-document.pdf';

// //         res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

// //         res.download(outputPath, downloadName, () => {
// //             req.files.forEach(file => fs.unlink(file.path, () => {}));

// //             if (outputPath && fs.existsSync(outputPath)) {
// //                 fs.unlink(outputPath, () => {});
// //             }
// //         });

// //     } catch (error) {
// //         console.error('Merge error:', error);

// //         req.files.forEach(file => fs.unlink(file.path, () => {}));

// //         if (outputPath && fs.existsSync(outputPath)) {
// //             fs.unlink(outputPath, () => {});
// //         }

// //         return res.status(500).json({
// //             error: 'Failed to merge PDFs. One of the files may be corrupted or password-protected.'
// //         });
// //     }
// // });

// // // ======================================================
// // // JPG TO PDF
// // // Convert images into individual PDFs and return ZIP
// // // ======================================================

// // app.post('/jpg-to-pdf', upload.array('imageFiles'), async (req, res) => {
// //     if (!req.files || req.files.length === 0) {
// //         return res.status(400).json({
// //             error: 'Please upload at least one image file.'
// //         });
// //     }

// //     let zipOutputPath;
// //     const createdFiles = [];

// //     try {
// //         const zip = new JSZip();

// //         for (const file of req.files) {
// //             const imageBytes = fs.readFileSync(file.path);
// //             const pdfDoc = await PDFDocument.create();

// //             let embeddedImage;

// //             if (
// //                 file.mimetype === 'image/png' ||
// //                 file.originalname.toLowerCase().endsWith('.png')
// //             ) {
// //                 embeddedImage = await pdfDoc.embedPng(imageBytes);
// //             } else {
// //                 embeddedImage = await pdfDoc.embedJpg(imageBytes);
// //             }

// //             const page = pdfDoc.addPage([
// //                 embeddedImage.width,
// //                 embeddedImage.height
// //             ]);

// //             page.drawImage(embeddedImage, {
// //                 x: 0,
// //                 y: 0,
// //                 width: embeddedImage.width,
// //                 height: embeddedImage.height
// //             });

// //             const pdfBytes = await pdfDoc.save();

// //             const baseName = path.basename(
// //                 file.originalname,
// //                 path.extname(file.originalname)
// //             );

// //             const pdfFileName = `${baseName}-converted.pdf`;
// //             const individualOutputPath = path.join(
// //                 outputDir,
// //                 `${Date.now()}-${pdfFileName}`
// //             );

// //             fs.writeFileSync(individualOutputPath, pdfBytes);

// //             createdFiles.push({
// //                 path: individualOutputPath,
// //                 name: pdfFileName
// //             });

// //             zip.file(pdfFileName, pdfBytes);
// //         }

// //         const zipContent = await zip.generateAsync({
// //             type: 'nodebuffer'
// //         });

// //         const zipFileName = `converted-pdfs-${Date.now()}.zip`;
// //         zipOutputPath = path.join(outputDir, zipFileName);

// //         fs.writeFileSync(zipOutputPath, zipContent);

// //         res.download(zipOutputPath, 'converted-images-pdfs.zip', () => {
// //             req.files.forEach(file => fs.unlink(file.path, () => {}));

// //             createdFiles.forEach(file => fs.unlink(file.path, () => {}));

// //             if (zipOutputPath && fs.existsSync(zipOutputPath)) {
// //                 fs.unlink(zipOutputPath, () => {});
// //             }
// //         });

// //     } catch (error) {
// //         console.error('JPG to PDF ZIP error:', error);

// //         req.files.forEach(file => fs.unlink(file.path, () => {}));

// //         createdFiles.forEach(file => fs.unlink(file.path, () => {}));

// //         if (zipOutputPath && fs.existsSync(zipOutputPath)) {
// //             fs.unlink(zipOutputPath, () => {});
// //         }

// //         return res.status(500).json({
// //             error: 'Failed to convert images to individual PDFs.'
// //         });
// //     }
// // });

// // // ======================================================
// // // SPLIT PDF
// // // Split PDF into individual pages and return ZIP
// // // ======================================================

// // app.post('/split', upload.single('pdfFile'), async (req, res) => {
// //     if (!req.file) {
// //         return res.status(400).json({
// //             error: 'Please upload a PDF file to split.'
// //         });
// //     }

// //     const splitMode = req.body.mode || 'all';
// //     const createdFiles = [];
// //     let zipOutputPath;

// //     try {
// //         const fileBytes = fs.readFileSync(req.file.path);
// //         const pdfDoc = await PDFDocument.load(fileBytes);

// //         const totalPages = pdfDoc.getPageCount();
// //         const zip = new JSZip();

// //         if (splitMode === 'all') {
// //             for (let i = 0; i < totalPages; i++) {
// //                 const subPdf = await PDFDocument.create();

// //                 const [copiedPage] = await subPdf.copyPages(pdfDoc, [i]);
// //                 subPdf.addPage(copiedPage);

// //                 const subPdfBytes = await subPdf.save();
// //                 const subFileName = `page-${i + 1}-split.pdf`;

// //                 const subPath = path.join(
// //                     outputDir,
// //                     `${Date.now()}-${subFileName}`
// //                 );

// //                 fs.writeFileSync(subPath, subPdfBytes);

// //                 createdFiles.push({
// //                     path: subPath,
// //                     name: subFileName
// //                 });

// //                 zip.file(subFileName, subPdfBytes);
// //             }
// //         }

// //         const zipContent = await zip.generateAsync({
// //             type: 'nodebuffer'
// //         });

// //         const zipFileName = `split-pdfs-${Date.now()}.zip`;
// //         zipOutputPath = path.join(outputDir, zipFileName);

// //         fs.writeFileSync(zipOutputPath, zipContent);

// //         res.download(zipOutputPath, 'split-documents.zip', () => {
// //             if (fs.existsSync(req.file.path)) {
// //                 fs.unlink(req.file.path, () => {});
// //             }

// //             createdFiles.forEach(file => fs.unlink(file.path, () => {}));

// //             if (zipOutputPath && fs.existsSync(zipOutputPath)) {
// //                 fs.unlink(zipOutputPath, () => {});
// //             }
// //         });

// //     } catch (error) {
// //         console.error('Split error:', error);

// //         if (req.file && fs.existsSync(req.file.path)) {
// //             fs.unlink(req.file.path, () => {});
// //         }

// //         createdFiles.forEach(file => fs.unlink(file.path, () => {}));

// //         if (zipOutputPath && fs.existsSync(zipOutputPath)) {
// //             fs.unlink(zipOutputPath, () => {});
// //         }

// //         return res.status(500).json({
// //             error: 'Failed to split PDF. The file may be password-protected or corrupted.'
// //         });
// //     }
// // });

// // // ======================================================
// // // COMPRESS PDF
// // // Compress PDF using Ghostscript
// // // ======================================================

// // app.post('/compress', upload.single('pdfFile'), async (req, res) => {
// //     if (!req.file) {
// //         return res.status(400).json({
// //             error: 'Please upload a PDF file to compress.'
// //         });
// //     }

// //     // const compressionLevel = (req.body.level || 'recommended').toLowerCase();
// //     const rawLevel = req.body.level || req.body.compression || req.body.quality || 'medium';
// //     const compressionLevel = rawLevel.toLowerCase();

// //     const inputPath = req.file.path;
// //     const outputFileName = `compressed-${Date.now()}.pdf`;
// //     const outputPath = path.join(outputDir, outputFileName);

// //     // Support frontend values: low, medium, high.
// //     // "recommended" is also supported as an alias for medium.
// //     // const levelSettings = {
// //     //     low: {
// //     //         preset: '/printer',
// //     //         dpi: 130,
// //     //         jpegQ: 65
// //     //     },
// //     //     medium: {
// //     //         preset: '/ebook',
// //     //         dpi: 96,
// //     //         jpegQ: 50
// //     //     },
// //     //     recommended: {
// //     //         preset: '/ebook',
// //     //         dpi: 96,
// //     //         jpegQ: 50
// //     //     },
// //     //     high: {
// //     //         preset: '/screen',
// //     //         dpi: 60,
// //     //         jpegQ: 30
// //     //     }
// //     // };

// // //     const levelSettings = {
// // //     low: {
// // //         preset: '/printer',
// // //         dpi: 120,
// // //         qFactor: 0.75
// // //     },
// // //     medium: {
// // //         preset: '/ebook',
// // //         dpi: 90,
// // //         qFactor: 1.2
// // //     },
// // //     recommended: {
// // //         preset: '/ebook',
// // //         dpi: 90,
// // //         qFactor: 1.2
// // //     },
// // //     high: {
// // //         preset: '/screen',
// // //         dpi: 60,
// // //         qFactor: 2.0
// // //     }
// // // };

// // const levelSettings = {
// //     low: {
// //         preset: '/printer',
// //         dpi: 150,
// //         qFactor: 0.9
// //     },
// //     // medium: {
// //     //     preset: '/ebook',
// //     //     dpi: 120,
// //     //     qFactor: 0.6
// //     // },
// //     recommended: {
// //     preset: '/screen',
// //     dpi: 120,
// //     qFactor: 0.6
// //     },
// //     recommended: {
// //         preset: '/ebook',
// //         dpi: 120,
// //         qFactor: 0.6
// //     },
// //     high: {
// //         preset: '/screen',
// //         dpi: 60,
// //         qFactor: 2.0
// //     }
// // };
// //     const config = levelSettings[compressionLevel] || levelSettings.recommended;

// //     const gsCommand = process.platform === 'win32'
// //         ? 'gswin64c'
// //         : 'gs';

// //     // const gsArgs = [
// //     //     '-sDEVICE=pdfwrite',
// //     //     '-dBATCH',
// //     //     `-dPDFSETTINGS=${config.preset}`,
// //     //     '-dNOPAUSE',
// //     //     '-dQUIET',

// //     //     // Image downsampling
// //     //     '-dDownsampleColorImages=true',
// //     //     '-dDownsampleGrayImages=true',
// //     //     '-dDownsampleMonoImages=true',

// //     //     '-dColorImageDownsampleThreshold=1.0',
// //     //     '-dGrayImageDownsampleThreshold=1.0',
// //     //     '-dMonoImageDownsampleThreshold=1.0',

// //     //     '-dColorImageDownsampleType=/Bicubic',
// //     //     '-dGrayImageDownsampleType=/Bicubic',
// //     //     '-dMonoImageDownsampleType=/Subsample',

// //     //     // Custom DPI settings
// //     //     `-dColorImageResolution=${config.dpi}`,
// //     //     `-dGrayImageResolution=${config.dpi}`,
// //     //     `-dMonoImageResolution=${config.dpi}`,

// //     //     // JPEG compression
// //     //     '-dAutoFilterColorImages=false',
// //     //     '-dAutoFilterGrayImages=false',
// //     //     '-dColorImageFilter=/DCTEncode',
// //     //     // '-dGrayImageFilter=/DCTEncode',
// //     //     // // `-dJPEGQ=${config.jpegQ}`,
// //     //     // '-c',
// //     //     // `<< /ColorACSImageDict << /QFactor ${config.qFactor} /Blend 1 /HSample [2 1 1 2] /VSample [2 1 1 2] >> >> setdistillerparams`,

// //     //     // // Font optimization
// //     //     // '-dCompressFonts=true',
// //     //     // '-dSubsetFonts=true',
// //     //     // '-dDetectDuplicateImages=true',

// //     //     // // `-sOutputFile=${outputPath}`,
// //     //     // // inputPath
// //     //     // `-sOutputFile=${outputPath}`,
// //     //     // '-f',
// //     //     // inputPath
// //     //             '-dGrayImageFilter=/DCTEncode',

// //     //     // Font optimization
// //     //     '-dCompressFonts=true',
// //     //     '-dSubsetFonts=true',
// //     //     '-dDetectDuplicateImages=true',

// //     //     // Output file
// //     //     `-sOutputFile=${outputPath}`,

// //     //     // JPEG quality settings
// //     //     '-c',
// //     //     `<< /ColorACSImageDict << /QFactor ${config.qFactor} /Blend 1 /HSample [2 1 1 2] /VSample [2 1 1 2] >> >> setdistillerparams`,

// //     //     // Input PDF
// //     //     '-f',
// //     //     inputPath
// //     // ];

// //     const gsArgs = [
// //     '-sDEVICE=pdfwrite',
// //     '-dBATCH',
// //     `-dPDFSETTINGS=${config.preset}`,
// //     '-dNOPAUSE',
// //     '-dQUIET',

// //     // Image downsampling
// //     '-dDownsampleColorImages=true',
// //     '-dDownsampleGrayImages=true',
// //     '-dDownsampleMonoImages=true',

// //     '-dColorImageDownsampleThreshold=1.0',
// //     '-dGrayImageDownsampleThreshold=1.0',
// //     '-dMonoImageDownsampleThreshold=1.0',

// //     '-dColorImageDownsampleType=/Bicubic',
// //     '-dGrayImageDownsampleType=/Bicubic',
// //     '-dMonoImageDownsampleType=/Subsample',

// //     // Custom DPI settings
// //     `-dColorImageResolution=${config.dpi}`,
// //     `-dGrayImageResolution=${config.dpi}`,
// //     `-dMonoImageResolution=${config.dpi}`,

// //     // JPEG compression
// //     '-dAutoFilterColorImages=false',
// //     '-dAutoFilterGrayImages=false',
// //     '-dColorImageFilter=/DCTEncode',
// //     '-dGrayImageFilter=/DCTEncode',

// //     // Font optimization
// //     '-dCompressFonts=true',
// //     '-dSubsetFonts=true',
// //     '-dDetectDuplicateImages=true',

// //     // Output file
// //     `-sOutputFile=${outputPath}`,

// //     // JPEG quality settings
// //     '-c',
// //     `<< /ColorACSImageDict << /QFactor ${config.qFactor} /Blend 1 /HSample [2 1 1 2] /VSample [2 1 1 2] >> >> setdistillerparams`,

// //     // Input PDF
// //     '-f',
// //     inputPath
// // ];

// //     execFile(gsCommand, gsArgs, (error) => {
// //         if (error) {
// //             console.error('Ghostscript compression error:', error);

// //             if (fs.existsSync(inputPath)) {
// //                 fs.unlink(inputPath, () => {});
// //             }

// //             if (fs.existsSync(outputPath)) {
// //                 fs.unlink(outputPath, () => {});
// //             }

// //             return res.status(500).json({
// //                 error: 'Unable to compress PDF. It may be encrypted or corrupted.'
// //             });
// //         }

// //         if (
// //             !fs.existsSync(outputPath) ||
// //             fs.statSync(outputPath).size === 0
// //         ) {
// //             if (fs.existsSync(inputPath)) {
// //                 fs.unlink(inputPath, () => {});
// //             }

// //             return res.status(500).json({
// //                 error: 'Compression failed to generate output file.'
// //             });
// //         }

// //         // const originalSize = fs.statSync(inputPath).size;
// //         // const compressedSize = fs.statSync(outputPath).size;

// //         const originalSize = fs.statSync(inputPath).size;
// //         const compressedSize = fs.statSync(outputPath).size;

// //         console.log('--- COMPRESS DEBUG ---');
// //         console.log('Frontend req.body:', req.body);
// //         console.log(`Matched Level: ${compressionLevel}`);
// //         console.log(`Original Size: ${originalSize} bytes`);
// //         console.log(`Ghostscript Output Size: ${compressedSize} bytes`);

// //         console.log(
// //             `Compression level: ${compressionLevel} | Original: ${originalSize} bytes | Ghostscript output: ${compressedSize} bytes`
// //         );

// //         // Return the smaller file only.
// //         const finalPath = compressedSize < originalSize
// //             ? outputPath
// //             : inputPath;

// //         const selectedResult = finalPath === outputPath
// //             ? 'compressed output'
// //             : 'original (compressed file was not smaller)';

// //         console.log(`Returning: ${selectedResult}`);

// //         res.download(finalPath, 'compressed-document.pdf', () => {
// //             if (fs.existsSync(inputPath)) {
// //                 fs.unlink(inputPath, () => {});
// //             }

// //             if (fs.existsSync(outputPath)) {
// //                 fs.unlink(outputPath, () => {});
// //             }
// //         });
// //     });
// // });

// // // // ======================================================
// // // // START SERVER
// // // // ======================================================

// // // app.listen(PORT, '0.0.0.0', () => {
// // //     console.log(`Server is running on port ${PORT}`);
// // // });

// // // YOUR EXISTING ROUTES (merge, split, compress, etc.)

// // // ======================================================
// // // UNLOCK PDF
// // // ======================================================

// // app.post('/unlock', upload.single('pdfFile'), (req, res) => {

// //     if (!req.file) {
// //         return res.status(400).json({
// //             error: 'Please upload a PDF file.'
// //         });
// //     }

// //     const inputPath = req.file.path;
// //     const outputPath = path.join(outputDir, `unlocked-${Date.now()}.pdf`);
// //     const password = typeof req.body.password === 'string' ? req.body.password : '';

// //     const qpdfArgs = ['--decrypt'];

// //     if (password) {
// //         qpdfArgs.push(`--password=${password}`);
// //     }

// //     qpdfArgs.push(inputPath, outputPath);

// //         execFile('C:\\Program Files\\qpdf 12.4.2\\bin\\qpdf.exe', qpdfArgs, (error) => {

// //         if (error) {
// //             console.error('Unlock PDF processing failed:', error.message);

// //             if (fs.existsSync(inputPath)) fs.unlink(inputPath, () => {});
// //             if (fs.existsSync(outputPath)) fs.unlink(outputPath, () => {});

// //             const message = error.code === 'ENOENT'
// //                 ? 'qpdf executable could not be found.'
// //                 : 'Could not process this PDF. It may be corrupted or require the correct opening password.';

// //             return res.status(400).json({ error: message });
// //         }

// //         if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {

// //             if (fs.existsSync(inputPath)) fs.unlink(inputPath, () => {});
// //             if (fs.existsSync(outputPath)) fs.unlink(outputPath, () => {});

// //             return res.status(500).json({
// //                 error: 'Unlocking did not produce a valid output file.'
// //             });
// //         }

// //         res.download(outputPath, 'unlocked-document.pdf', () => {
// //             if (fs.existsSync(inputPath)) fs.unlink(inputPath, () => {});
// //             if (fs.existsSync(outputPath)) fs.unlink(outputPath, () => {});
// //         });

// //     });
// // });

// // // ======================================================
// // // START SERVER
// // // ======================================================

// // app.listen(PORT, '0.0.0.0', () => {
// //     console.log(`Server is running on port ${PORT}`);
// // });

// const express = require('express');
// const multer = require('multer');
// const fs = require('fs');
// const path = require('path');
// const { execFile } = require('child_process');
// const { PDFDocument } = require('pdf-lib');
// const JSZip = require('jszip');
// const pdfParse = require('pdf-parse');

// const app = express();
// const PORT = process.env.PORT || 3000;

// const uploadDir = path.join(__dirname, 'uploads');
// const outputDir = path.join(__dirname, 'outputs');

// if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
// if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// const upload = multer({ dest: uploadDir });

// app.use(express.static(path.join(__dirname)));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// app.use('/ffmpeg', express.static(path.join(__dirname, 'node_modules/@ffmpeg/ffmpeg/dist/umd')));
// app.use('/ffmpeg-util', express.static(path.join(__dirname, 'node_modules/@ffmpeg/util/dist/umd')));
// app.use('/ffmpeg-core', express.static(path.join(__dirname, 'node_modules/@ffmpeg/core/dist/umd')));
// // ======================================================
// // WORD TO PDF
// // Convert DOCX / DOC to PDF using LibreOffice
// // ======================================================

// app.post('/word-to-pdf', upload.single('wordFile'), (req, res) => {
//     if (!req.file) {
//         return res.status(400).json({
//             error: 'Please upload a Word (.docx) file.'
//         });
//     }

//     const originalExt = path.extname(req.file.originalname).toLowerCase() || '.docx';
//     const inputPathWithExt = `${req.file.path}${originalExt}`;

//     try {
//         fs.renameSync(req.file.path, inputPathWithExt);
//     } catch (renameErr) {
//         console.error('File rename error:', renameErr);
//         return res.status(500).json({ error: 'Failed to prepare uploaded file.' });
//     }

//     const baseName = path.basename(inputPathWithExt, originalExt);
//     const generatedPdfPath = path.join(outputDir, `${baseName}.pdf`);

//     const sofficeCommand = process.platform === 'win32'
//         ? 'C:\\Program Files\\LibreOffice\\program\\soffice.exe'
//         : 'libreoffice';

//     const userProfileDir = path.join(outputDir, `lo-profile-${Date.now()}-${Math.round(Math.random() * 1e5)}`);
//     const userInstallationUri = `file:///${userProfileDir.replace(/\\/g, '/')}`;

//     const loArgs = [
//         `-env:UserInstallation=${userInstallationUri}`,
//         '--headless',
//         '--convert-to',
//         'pdf',
//         '--outdir',
//         outputDir,
//         inputPathWithExt
//     ];

//     execFile(sofficeCommand, loArgs, (error) => {
//         fs.rm(userProfileDir, { recursive: true, force: true }, () => {});

//         if (error) {
//             console.error('LibreOffice conversion error:', error);
//             if (fs.existsSync(inputPathWithExt)) fs.unlink(inputPathWithExt, () => {});
//             if (fs.existsSync(generatedPdfPath)) fs.unlink(generatedPdfPath, () => {});

//             const message = error.code === 'ENOENT'
//                 ? 'LibreOffice is not installed on the server at C:\\Program Files\\LibreOffice\\program\\soffice.exe'
//                 : 'Failed to convert Word document to PDF.';

//             return res.status(500).json({ error: message });
//         }

//         if (!fs.existsSync(generatedPdfPath) || fs.statSync(generatedPdfPath).size === 0) {
//             if (fs.existsSync(inputPathWithExt)) fs.unlink(inputPathWithExt, () => {});
//             return res.status(500).json({
//                 error: 'Conversion failed to generate a valid PDF file.'
//             });
//         }

//         const originalBaseName = path.basename(
//             req.file.originalname,
//             path.extname(req.file.originalname)
//         );
//         const downloadName = `${originalBaseName}.pdf`;

//         res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

//         res.download(generatedPdfPath, downloadName, () => {
//             if (fs.existsSync(inputPathWithExt)) fs.unlink(inputPathWithExt, () => {});
//             if (fs.existsSync(generatedPdfPath)) fs.unlink(generatedPdfPath, () => {});
//         });
//     });
// });
// // ======================================================
// // MERGE PDF
// // ======================================================

// app.post('/merge', upload.array('pdfFiles'), async (req, res) => {
//     if (!req.files || req.files.length < 2) {
//         if (req.files) {
//             req.files.forEach(file => fs.unlink(file.path, () => {}));
//         }

//         return res.status(400).json({
//             error: 'Please upload at least 2 PDF files to merge.'
//         });
//     }

//     let outputPath;

//     try {
//         const mergedPdf = await PDFDocument.create();
//         const firstWords = [];

//         for (const file of req.files) {
//             const fileBytes = fs.readFileSync(file.path);

//             try {
//                 const pdfData = await pdfParse(fileBytes);

//                 if (pdfData && pdfData.text) {
//                     const cleanedText = pdfData.text.trim().replace(/[\r\n]+/g, ' ');
//                     const firstWord = cleanedText.split(/\s+/)[0];

//                     if (firstWord) {
//                         const sanitizedWord = firstWord.replace(/[^a-zA-Z0-9-_]/g, '');

//                         if (sanitizedWord) {
//                             firstWords.push(sanitizedWord);
//                         }
//                     }
//                 }
//             } catch (parseErr) {
//                 console.warn(
//                     'Could not parse text for filename, skipping word:',
//                     parseErr.message
//                 );
//             }

//             const pdfDoc = await PDFDocument.load(fileBytes);
//             const copiedPages = await mergedPdf.copyPages(
//                 pdfDoc,
//                 pdfDoc.getPageIndices()
//             );

//             copiedPages.forEach(page => mergedPdf.addPage(page));
//         }

//         const mergedPdfBytes = await mergedPdf.save();

//         const outputFileName = `merged-${Date.now()}.pdf`;
//         outputPath = path.join(outputDir, outputFileName);

//         fs.writeFileSync(outputPath, mergedPdfBytes);

//         const downloadName = firstWords.length > 0
//             ? `${firstWords.join('-and-')}-merged.pdf`
//             : 'merged-document.pdf';

//         res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

//         res.download(outputPath, downloadName, () => {
//             req.files.forEach(file => fs.unlink(file.path, () => {}));

//             if (outputPath && fs.existsSync(outputPath)) {
//                 fs.unlink(outputPath, () => {});
//             }
//         });

//     } catch (error) {
//         console.error('Merge error:', error);

//         req.files.forEach(file => fs.unlink(file.path, () => {}));

//         if (outputPath && fs.existsSync(outputPath)) {
//             fs.unlink(outputPath, () => {});
//         }

//         return res.status(500).json({
//             error: 'Failed to merge PDFs. One of the files may be corrupted or password-protected.'
//         });
//     }
// });
// // ======================================================
// // JPG TO PDF
// // Convert images into individual PDFs and return ZIP
// // ======================================================

// app.post('/jpg-to-pdf', upload.array('imageFiles'), async (req, res) => {
//     if (!req.files || req.files.length === 0) {
//         return res.status(400).json({
//             error: 'Please upload at least one image file.'
//         });
//     }

//     let zipOutputPath;
//     const createdFiles = [];

//     try {
//         const zip = new JSZip();

//         for (const file of req.files) {
//             const imageBytes = fs.readFileSync(file.path);
//             const pdfDoc = await PDFDocument.create();

//             let embeddedImage;

//             if (
//                 file.mimetype === 'image/png' ||
//                 file.originalname.toLowerCase().endsWith('.png')
//             ) {
//                 embeddedImage = await pdfDoc.embedPng(imageBytes);
//             } else {
//                 embeddedImage = await pdfDoc.embedJpg(imageBytes);
//             }

//             const page = pdfDoc.addPage([
//                 embeddedImage.width,
//                 embeddedImage.height
//             ]);

//             page.drawImage(embeddedImage, {
//                 x: 0,
//                 y: 0,
//                 width: embeddedImage.width,
//                 height: embeddedImage.height
//             });

//             const pdfBytes = await pdfDoc.save();

//             const baseName = path.basename(
//                 file.originalname,
//                 path.extname(file.originalname)
//             );

//             const pdfFileName = `${baseName}-converted.pdf`;
//             const individualOutputPath = path.join(
//                 outputDir,
//                 `${Date.now()}-${pdfFileName}`
//             );

//             fs.writeFileSync(individualOutputPath, pdfBytes);

//             createdFiles.push({
//                 path: individualOutputPath,
//                 name: pdfFileName
//             });

//             zip.file(pdfFileName, pdfBytes);
//         }

//         const zipContent = await zip.generateAsync({
//             type: 'nodebuffer'
//         });

//         const zipFileName = `converted-pdfs-${Date.now()}.zip`;
//         zipOutputPath = path.join(outputDir, zipFileName);

//         fs.writeFileSync(zipOutputPath, zipContent);

//         res.download(zipOutputPath, 'converted-images-pdfs.zip', () => {
//             req.files.forEach(file => fs.unlink(file.path, () => {}));
//             createdFiles.forEach(file => fs.unlink(file.path, () => {}));

//             if (zipOutputPath && fs.existsSync(zipOutputPath)) {
//                 fs.unlink(zipOutputPath, () => {});
//             }
//         });

//     } catch (error) {
//         console.error('JPG to PDF ZIP error:', error);

//         req.files.forEach(file => fs.unlink(file.path, () => {}));
//         createdFiles.forEach(file => fs.unlink(file.path, () => {}));

//         if (zipOutputPath && fs.existsSync(zipOutputPath)) {
//             fs.unlink(zipOutputPath, () => {});
//         }

//         return res.status(500).json({
//             error: 'Failed to convert images to individual PDFs.'
//         });
//     }
// });
// // ======================================================
// // SPLIT PDF
// // Split PDF into individual pages and return ZIP
// // ======================================================

// app.post('/split', upload.single('pdfFile'), async (req, res) => {
//     if (!req.file) {
//         return res.status(400).json({
//             error: 'Please upload a PDF file to split.'
//         });
//     }

//     const splitMode = req.body.mode || 'all';
//     const createdFiles = [];
//     let zipOutputPath;

//     try {
//         const fileBytes = fs.readFileSync(req.file.path);
//         const pdfDoc = await PDFDocument.load(fileBytes);

//         const totalPages = pdfDoc.getPageCount();
//         const zip = new JSZip();

//         if (splitMode === 'all') {
//             for (let i = 0; i < totalPages; i++) {
//                 const subPdf = await PDFDocument.create();

//                 const [copiedPage] = await subPdf.copyPages(pdfDoc, [i]);
//                 subPdf.addPage(copiedPage);

//                 const subPdfBytes = await subPdf.save();
//                 const subFileName = `page-${i + 1}-split.pdf`;

//                 const subPath = path.join(
//                     outputDir,
//                     `${Date.now()}-${subFileName}`
//                 );

//                 fs.writeFileSync(subPath, subPdfBytes);

//                 createdFiles.push({
//                     path: subPath,
//                     name: subFileName
//                 });

//                 zip.file(subFileName, subPdfBytes);
//             }
//         }

//         const zipContent = await zip.generateAsync({
//             type: 'nodebuffer'
//         });

//         const zipFileName = `split-pdfs-${Date.now()}.zip`;
//         zipOutputPath = path.join(outputDir, zipFileName);

//         fs.writeFileSync(zipOutputPath, zipContent);

//         res.download(zipOutputPath, 'split-documents.zip', () => {
//             if (fs.existsSync(req.file.path)) {
//                 fs.unlink(req.file.path, () => {});
//             }

//             createdFiles.forEach(file => fs.unlink(file.path, () => {}));

//             if (zipOutputPath && fs.existsSync(zipOutputPath)) {
//                 fs.unlink(zipOutputPath, () => {});
//             }
//         });

//     } catch (error) {
//         console.error('Split error:', error);

//         if (req.file && fs.existsSync(req.file.path)) {
//             fs.unlink(req.file.path, () => {});
//         }

//         createdFiles.forEach(file => fs.unlink(file.path, () => {}));

//         if (zipOutputPath && fs.existsSync(zipOutputPath)) {
//             fs.unlink(zipOutputPath, () => {});
//         }

//         return res.status(500).json({
//             error: 'Failed to split PDF. The file may be password-protected or corrupted.'
//         });
//     }
// });
// // ======================================================
// // COMPRESS PDF
// // Compress PDF using Ghostscript
// // ======================================================

// app.post('/compress', upload.single('pdfFile'), async (req, res) => {
//     if (!req.file) {
//         return res.status(400).json({
//             error: 'Please upload a PDF file to compress.'
//         });
//     }

//     const rawLevel = req.body.level || req.body.compression || req.body.quality || 'medium';
//     const compressionLevel = rawLevel.toLowerCase();

//     const inputPath = req.file.path;
//     const outputFileName = `compressed-${Date.now()}.pdf`;
//     const outputPath = path.join(outputDir, outputFileName);

//     const levelSettings = {
//         low: {
//             preset: '/printer',
//             dpi: 150,
//             qFactor: 0.9
//         },
//         medium: {
//             preset: '/ebook',
//             dpi: 120,
//             qFactor: 0.6
//         },
//         recommended: {
//             preset: '/ebook',
//             dpi: 120,
//             qFactor: 0.6
//         },
//         high: {
//             preset: '/screen',
//             dpi: 60,
//             qFactor: 2.0
//         }
//     };

//     const config = levelSettings[compressionLevel] || levelSettings.recommended;

//     const gsCommand = process.platform === 'win32'
//         ? 'gswin64c'
//         : 'gs';

//     const gsArgs = [
//         '-sDEVICE=pdfwrite',
//         '-dBATCH',
//         `-dPDFSETTINGS=${config.preset}`,
//         '-dNOPAUSE',
//         '-dQUIET',

//         '-dDownsampleColorImages=true',
//         '-dDownsampleGrayImages=true',
//         '-dDownsampleMonoImages=true',

//         '-dColorImageDownsampleThreshold=1.0',
//         '-dGrayImageDownsampleThreshold=1.0',
//         '-dMonoImageDownsampleThreshold=1.0',

//         '-dColorImageDownsampleType=/Bicubic',
//         '-dGrayImageDownsampleType=/Bicubic',
//         '-dMonoImageDownsampleType=/Subsample',

//         `-dColorImageResolution=${config.dpi}`,
//         `-dGrayImageResolution=${config.dpi}`,
//         `-dMonoImageResolution=${config.dpi}`,

//         '-dAutoFilterColorImages=false',
//         '-dAutoFilterGrayImages=false',
//         '-dColorImageFilter=/DCTEncode',
//         '-dGrayImageFilter=/DCTEncode',

//         '-dCompressFonts=true',
//         '-dSubsetFonts=true',
//         '-dDetectDuplicateImages=true',

//         `-sOutputFile=${outputPath}`,

//         '-c',
//         `<< /ColorACSImageDict << /QFactor ${config.qFactor} /Blend 1 /HSample [2 1 1 2] /VSample [2 1 1 2] >> >> setdistillerparams`,

//         '-f',
//         inputPath
//     ];

//     execFile(gsCommand, gsArgs, (error) => {
//         if (error) {
//             console.error('Ghostscript compression error:', error);

//             if (fs.existsSync(inputPath)) fs.unlink(inputPath, () => {});
//             if (fs.existsSync(outputPath)) fs.unlink(outputPath, () => {});

//             return res.status(500).json({
//                 error: 'Unable to compress PDF. It may be encrypted or corrupted.'
//             });
//         }

//         if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
//             if (fs.existsSync(inputPath)) fs.unlink(inputPath, () => {});

//             return res.status(500).json({
//                 error: 'Compression failed to generate output file.'
//             });
//         }

//         const originalSize = fs.statSync(inputPath).size;
//         const compressedSize = fs.statSync(outputPath).size;

//         const finalPath = compressedSize < originalSize
//             ? outputPath
//             : inputPath;

//         res.download(finalPath, 'compressed-document.pdf', () => {
//             if (fs.existsSync(inputPath)) fs.unlink(inputPath, () => {});
//             if (fs.existsSync(outputPath)) fs.unlink(outputPath, () => {});
//         });
//     });
// });
// // ======================================================
// // UNLOCK PDF
// // ======================================================

// app.post('/unlock', upload.single('pdfFile'), (req, res) => {
//     if (!req.file) {
//         return res.status(400).json({
//             error: 'Please upload a PDF file.'
//         });
//     }

//     const inputPath = req.file.path;
//     const outputPath = path.join(outputDir, `unlocked-${Date.now()}.pdf`);
//     const password = typeof req.body.password === 'string' ? req.body.password : '';

//     const qpdfArgs = ['--decrypt'];

//     if (password) {
//         qpdfArgs.push(`--password=${password}`);
//     }

//     qpdfArgs.push(inputPath, outputPath);

//     execFile('C:\\Program Files\\qpdf 12.4.2\\bin\\qpdf.exe', qpdfArgs, (error) => {
//         if (error) {
//             console.error('Unlock PDF processing failed:', error.message);

//             if (fs.existsSync(inputPath)) fs.unlink(inputPath, () => {});
//             if (fs.existsSync(outputPath)) fs.unlink(outputPath, () => {});

//             const message = error.code === 'ENOENT'
//                 ? 'qpdf executable could not be found.'
//                 : 'Could not process this PDF. It may be corrupted or require the correct opening password.';

//             return res.status(400).json({ error: message });
//         }

//         if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
//             if (fs.existsSync(inputPath)) fs.unlink(inputPath, () => {});
//             if (fs.existsSync(outputPath)) fs.unlink(outputPath, () => {});

//             return res.status(500).json({
//                 error: 'Unlocking did not produce a valid output file.'
//             });
//         }

//         res.download(outputPath, 'unlocked-document.pdf', () => {
//             if (fs.existsSync(inputPath)) fs.unlink(inputPath, () => {});
//             if (fs.existsSync(outputPath)) fs.unlink(outputPath, () => {});
//         });
//     });
// });

// // ======================================================
// // START SERVER
// // ======================================================

// app.listen(PORT, '0.0.0.0', () => {
//     console.log(`Server is running on port ${PORT}`);
// });
// const express = require('express');
// const multer = require('multer');
// const fs = require('fs');
// const path = require('path');
// const { pathToFileURL } = require('url');
// const { execFile } = require('child_process');
// const { PDFDocument } = require('pdf-lib');
// const JSZip = require('jszip');
// const pdfParse = require('pdf-parse');

// const app = express();
// const PORT = process.env.PORT || 3000;

// const uploadDir = path.join(__dirname, 'uploads');
// const outputDir = path.join(__dirname, 'outputs');

// if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
// if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

// const upload = multer({ dest: uploadDir });

// app.use(express.static(path.join(__dirname)));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// app.use('/ffmpeg', express.static(path.join(__dirname, 'node_modules/@ffmpeg/ffmpeg/dist/umd')));
// app.use('/ffmpeg-util', express.static(path.join(__dirname, 'node_modules/@ffmpeg/util/dist/umd')));
// app.use('/ffmpeg-core', express.static(path.join(__dirname, 'node_modules/@ffmpeg/core/dist/umd')));

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
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

// Automatically inject wide-layout.css into all HTML pages without altering functionality
// app.use((req, res, next) => {
//     if (req.method === 'GET' && (req.path === '/' || req.path.endsWith('.html'))) {
//         const relPath = req.path === '/' ? 'index.html' : req.path.replace(/^\/+/, '');
//         const filePath = path.join(__dirname, relPath);

//         if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
//             let html = fs.readFileSync(filePath, 'utf8');
//             if (html.includes('</head>') && !html.includes('/wide-layout.css')) {
//                 html = html.replace('</head>', '    <link rel="stylesheet" href="/wide-layout.css">\n</head>');
//             }
//             return res.type('html').send(html);
//         }
//     }
//     next();
// });
// app.use((req, res, next) => {
//     if (req.method === 'GET' && (req.path === '/' || req.path.endsWith('.html'))) {
//         const relPath = req.path === '/' ? 'index.html' : req.path.replace(/^\/+/, '');
//         const filePath = path.join(__dirname, relPath);

//         if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
//             let html = fs.readFileSync(filePath, 'utf8');
//             if (html.includes('</head>') && !html.includes('/wide-layout.css')) {
//                 const faviconTag = `    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://w3.org' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🧰</text></svg>">`;
//                 html = html.replace('</head>', `${faviconTag}\n    <link rel="stylesheet" href="/wide-layout.css">\n</head>`);
//             }
//             return res.type('html').send(html);
//         }
//     }
//     next();
// });
// app.use((req, res, next) => {
//     if (req.method === 'GET' && (req.path === '/' || req.path.endsWith('.html'))) {
//         const relPath = req.path === '/' ? 'index.html' : req.path.replace(/^\/+/, '');
//         const filePath = path.join(__dirname, relPath);

//         if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
//             let html = fs.readFileSync(filePath, 'utf8');
//             if (html.includes('</head>') && !html.includes('/wide-layout.css')) {
//                 html = html.replace('</head>', '    <link rel="stylesheet" href="/wide-layout.css">\n</head>');
//             }
//             return res.type('html').send(html);
//         }
//     }
//     next();
// });

app.use((req, res, next) => {
    if (req.method === 'GET' && (req.path === '/' || req.path.endsWith('.html'))) {
        const relPath = req.path === '/' ? 'index.html' : req.path.replace(/^\/+/, '');
        const filePath = path.join(__dirname, relPath);

        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            let html = fs.readFileSync(filePath, 'utf8');
            if (html.includes('</head>') && !html.includes('/wide-layout.css')) {
                html = html.replace('</head>', '    <link rel="stylesheet" href="/wide-layout.css">\n</head>');
            }
            if (relPath !== 'index.html' && html.includes('</body>') && !html.includes('/stars-bg.js')) {
                html = html.replace('</body>', '    <script src="/stars-bg.js" defer></script>\n</body>');
            }
            return res.type('html').send(html);
        }
    }
    next();
});


app.get('/favicon.ico', (req, res) => res.status(204).end());

app.use(express.static(path.join(__dirname)));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/ffmpeg', express.static(path.join(__dirname, 'node_modules/@ffmpeg/ffmpeg/dist/umd')));
app.use('/ffmpeg-util', express.static(path.join(__dirname, 'node_modules/@ffmpeg/util/dist/umd')));
app.use('/ffmpeg-core', express.static(path.join(__dirname, 'node_modules/@ffmpeg/core/dist/umd')));

// ======================================================
// WORD TO PDF
// Convert DOCX / DOC to PDF using LibreOffice
// ======================================================

app.post('/word-to-pdf', upload.single('wordFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            error: 'Please upload a Word (.docx) file.'
        });
    }

    const originalExt = path.extname(req.file.originalname).toLowerCase() || '.docx';
    const inputPathWithExt = `${req.file.path}${originalExt}`;

    try {
        fs.renameSync(req.file.path, inputPathWithExt);
    } catch (renameErr) {
        console.error('File rename error:', renameErr);
        return res.status(500).json({ error: 'Failed to prepare uploaded file.' });
    }

    const baseName = path.basename(inputPathWithExt, originalExt);
    const generatedPdfPath = path.join(outputDir, `${baseName}.pdf`);

    const sofficeCommand = process.platform === 'win32'
        ? 'C:\\Program Files\\LibreOffice\\program\\soffice.com'
        : 'libreoffice';

    const userProfileDir = path.join(outputDir, `lo-profile-${Date.now()}-${Math.round(Math.random() * 1e5)}`);
    fs.mkdirSync(userProfileDir, { recursive: true });
    const userInstallationUri = pathToFileURL(userProfileDir).href;

    const loArgs = [
        `-env:UserInstallation=${userInstallationUri}`,
        '--headless',
        '--nologo',
        '--nodefault',
        '--nofirststartwizard',
        '--convert-to',
        'pdf',
        '--outdir',
        outputDir,
        inputPathWithExt
    ];

    execFile(sofficeCommand, loArgs, { windowsHide: true }, (error, stdout, stderr) => {
        fs.rm(userProfileDir, { recursive: true, force: true }, () => {});

        if (error) {
            console.error('LibreOffice conversion error:', error);
            if (stderr) console.error('LibreOffice stderr:', stderr);
            if (fs.existsSync(inputPathWithExt)) fs.unlink(inputPathWithExt, () => {});
            if (fs.existsSync(generatedPdfPath)) fs.unlink(generatedPdfPath, () => {});

            const message = error.code === 'ENOENT'
                ? 'LibreOffice is not installed on the server at C:\\Program Files\\LibreOffice\\program\\soffice.com'
                : 'Failed to convert Word document to PDF.';

            return res.status(500).json({ error: message });
        }

        if (!fs.existsSync(generatedPdfPath) || fs.statSync(generatedPdfPath).size === 0) {
            if (fs.existsSync(inputPathWithExt)) fs.unlink(inputPathWithExt, () => {});
            return res.status(500).json({
                error: 'Conversion failed to generate a valid PDF file.'
            });
        }

        const originalBaseName = path.basename(
            req.file.originalname,
            path.extname(req.file.originalname)
        );
        const downloadName = `${originalBaseName}.pdf`;

        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

        res.download(generatedPdfPath, downloadName, () => {
            if (fs.existsSync(inputPathWithExt)) fs.unlink(inputPathWithExt, () => {});
            if (fs.existsSync(generatedPdfPath)) fs.unlink(generatedPdfPath, () => {});
        });
    });
});
// ======================================================
// MERGE PDF
// ======================================================

app.post('/merge', upload.array('pdfFiles'), async (req, res) => {
    if (!req.files || req.files.length < 2) {
        if (req.files) {
            req.files.forEach(file => fs.unlink(file.path, () => {}));
        }

        return res.status(400).json({
            error: 'Please upload at least 2 PDF files to merge.'
        });
    }

    let outputPath;

    try {
        const mergedPdf = await PDFDocument.create();
        const firstWords = [];

        for (const file of req.files) {
            const fileBytes = fs.readFileSync(file.path);

            try {
                const pdfData = await pdfParse(fileBytes);

                if (pdfData && pdfData.text) {
                    const cleanedText = pdfData.text.trim().replace(/[\r\n]+/g, ' ');
                    const firstWord = cleanedText.split(/\s+/).at(0);

                    if (firstWord) {
                        const sanitizedWord = firstWord.replace(/[^a-zA-Z0-9-_]/g, '');

                        if (sanitizedWord) {
                            firstWords.push(sanitizedWord);
                        }
                    }
                }
            } catch (parseErr) {
                console.warn(
                    'Could not parse text for filename, skipping word:',
                    parseErr.message
                );
            }

            const pdfDoc = await PDFDocument.load(fileBytes);
            const copiedPages = await mergedPdf.copyPages(
                pdfDoc,
                pdfDoc.getPageIndices()
            );

            copiedPages.forEach(page => mergedPdf.addPage(page));
        }

        const mergedPdfBytes = await mergedPdf.save();

        const outputFileName = `merged-${Date.now()}.pdf`;
        outputPath = path.join(outputDir, outputFileName);

        fs.writeFileSync(outputPath, mergedPdfBytes);

        const downloadName = firstWords.length > 0
            ? `${firstWords.join('-and-')}-merged.pdf`
            : 'merged-document.pdf';

        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

        res.download(outputPath, downloadName, () => {
            req.files.forEach(file => fs.unlink(file.path, () => {}));

            if (outputPath && fs.existsSync(outputPath)) {
                fs.unlink(outputPath, () => {});
            }
        });

    } catch (error) {
        console.error('Merge error:', error);

        req.files.forEach(file => fs.unlink(file.path, () => {}));

        if (outputPath && fs.existsSync(outputPath)) {
            fs.unlink(outputPath, () => {});
        }

        return res.status(500).json({
            error: 'Failed to merge PDFs. One of the files may be corrupted or password-protected.'
        });
    }
});
// ======================================================
// JPG TO PDF
// Convert images into individual PDFs and return ZIP
// ======================================================

app.post('/jpg-to-pdf', upload.array('imageFiles'), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({
            error: 'Please upload at least one image file.'
        });
    }

    let zipOutputPath;
    const createdFiles = [];

    try {
        const zip = new JSZip();

        for (const file of req.files) {
            const imageBytes = fs.readFileSync(file.path);
            const pdfDoc = await PDFDocument.create();

            let embeddedImage;

            if (
                file.mimetype === 'image/png' ||
                file.originalname.toLowerCase().endsWith('.png')
            ) {
                embeddedImage = await pdfDoc.embedPng(imageBytes);
            } else {
                embeddedImage = await pdfDoc.embedJpg(imageBytes);
            }

            const page = pdfDoc.addPage([
                embeddedImage.width,
                embeddedImage.height
            ]);

            page.drawImage(embeddedImage, {
                x: 0,
                y: 0,
                width: embeddedImage.width,
                height: embeddedImage.height
            });

            const pdfBytes = await pdfDoc.save();

            const baseName = path.basename(
                file.originalname,
                path.extname(file.originalname)
            );

            const pdfFileName = `${baseName}-converted.pdf`;
            const individualOutputPath = path.join(
                outputDir,
                `${Date.now()}-${pdfFileName}`
            );

            fs.writeFileSync(individualOutputPath, pdfBytes);

            createdFiles.push({
                path: individualOutputPath,
                name: pdfFileName
            });

            zip.file(pdfFileName, pdfBytes);
        }

        const zipContent = await zip.generateAsync({
            type: 'nodebuffer'
        });

        const zipFileName = `converted-pdfs-${Date.now()}.zip`;
        zipOutputPath = path.join(outputDir, zipFileName);

        fs.writeFileSync(zipOutputPath, zipContent);

        res.download(zipOutputPath, 'converted-images-pdfs.zip', () => {
            req.files.forEach(file => fs.unlink(file.path, () => {}));
            createdFiles.forEach(file => fs.unlink(file.path, () => {}));

            if (zipOutputPath && fs.existsSync(zipOutputPath)) {
                fs.unlink(zipOutputPath, () => {});
            }
        });

    } catch (error) {
        console.error('JPG to PDF ZIP error:', error);

        req.files.forEach(file => fs.unlink(file.path, () => {}));
        createdFiles.forEach(file => fs.unlink(file.path, () => {}));

        if (zipOutputPath && fs.existsSync(zipOutputPath)) {
            fs.unlink(zipOutputPath, () => {});
        }

        return res.status(500).json({
            error: 'Failed to convert images to individual PDFs.'
        });
    }
});
// ======================================================
// SPLIT PDF
// Split PDF into individual pages and return ZIP
// ======================================================

app.post('/split', upload.single('pdfFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            error: 'Please upload a PDF file to split.'
        });
    }

    const splitMode = req.body.mode || 'all';
    const createdFiles = [];
    let zipOutputPath;

    try {
        const fileBytes = fs.readFileSync(req.file.path);
        const pdfDoc = await PDFDocument.load(fileBytes);

        const totalPages = pdfDoc.getPageCount();
        const zip = new JSZip();

        if (splitMode === 'all') {
            for (let i = 0; i < totalPages; i++) {
                const subPdf = await PDFDocument.create();

                const [copiedPage] = await subPdf.copyPages(pdfDoc, [i]);
                subPdf.addPage(copiedPage);

                const subPdfBytes = await subPdf.save();
                const subFileName = `page-${i + 1}-split.pdf`;

                const subPath = path.join(
                    outputDir,
                    `${Date.now()}-${subFileName}`
                );

                fs.writeFileSync(subPath, subPdfBytes);

                createdFiles.push({
                    path: subPath,
                    name: subFileName
                });

                zip.file(subFileName, subPdfBytes);
            }
        }

        const zipContent = await zip.generateAsync({
            type: 'nodebuffer'
        });

        const zipFileName = `split-pdfs-${Date.now()}.zip`;
        zipOutputPath = path.join(outputDir, zipFileName);

        fs.writeFileSync(zipOutputPath, zipContent);

        res.download(zipOutputPath, 'split-documents.zip', () => {
            if (fs.existsSync(req.file.path)) {
                fs.unlink(req.file.path, () => {});
            }

            createdFiles.forEach(file => fs.unlink(file.path, () => {}));

            if (zipOutputPath && fs.existsSync(zipOutputPath)) {
                fs.unlink(zipOutputPath, () => {});
            }
        });

    } catch (error) {
        console.error('Split error:', error);

        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlink(req.file.path, () => {});
        }

        createdFiles.forEach(file => fs.unlink(file.path, () => {}));

        if (zipOutputPath && fs.existsSync(zipOutputPath)) {
            fs.unlink(zipOutputPath, () => {});
        }

        return res.status(500).json({
            error: 'Failed to split PDF. The file may be password-protected or corrupted.'
        });
    }
});
// ======================================================
// COMPRESS PDF
// Compress PDF using Ghostscript
// ======================================================

app.post('/compress', upload.single('pdfFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            error: 'Please upload a PDF file to compress.'
        });
    }

    const rawLevel = req.body.level || req.body.compression || req.body.quality || 'medium';
    const compressionLevel = rawLevel.toLowerCase();

    const inputPath = req.file.path;
    const outputFileName = `compressed-${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, outputFileName);

    const levelSettings = {
        low: {
            preset: '/printer',
            dpi: 150,
            qFactor: 0.9
        },
        medium: {
            preset: '/ebook',
            dpi: 120,
            qFactor: 0.6
        },
        recommended: {
            preset: '/ebook',
            dpi: 120,
            qFactor: 0.6
        },
        high: {
            preset: '/screen',
            dpi: 60,
            qFactor: 2.0
        }
    };

    const config = levelSettings[compressionLevel] || levelSettings.recommended;

    const gsCommand = process.platform === 'win32'
        ? 'gswin64c'
        : 'gs';

    const gsArgs = [
        '-sDEVICE=pdfwrite',
        '-dBATCH',
        `-dPDFSETTINGS=${config.preset}`,
        '-dNOPAUSE',
        '-dQUIET',

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

        '-dCompressFonts=true',
        '-dSubsetFonts=true',
        '-dDetectDuplicateImages=true',

        `-sOutputFile=${outputPath}`,

        '-c',
        `<< /ColorACSImageDict << /QFactor ${config.qFactor} /Blend 1 /HSample [2 1 1 2] /VSample [2 1 1 2] >> >> setdistillerparams`,

        '-f',
        inputPath
    ];

    execFile(gsCommand, gsArgs, (error) => {
        if (error) {
            console.error('Ghostscript compression error:', error);

            if (fs.existsSync(inputPath)) fs.unlink(inputPath, () => {});
            if (fs.existsSync(outputPath)) fs.unlink(outputPath, () => {});

            return res.status(500).json({
                error: 'Unable to compress PDF. It may be encrypted or corrupted.'
            });
        }

        if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
            if (fs.existsSync(inputPath)) fs.unlink(inputPath, () => {});

            return res.status(500).json({
                error: 'Compression failed to generate output file.'
            });
        }

        const originalSize = fs.statSync(inputPath).size;
        const compressedSize = fs.statSync(outputPath).size;

        const finalPath = compressedSize < originalSize
            ? outputPath
            : inputPath;

        res.download(finalPath, 'compressed-document.pdf', () => {
            if (fs.existsSync(inputPath)) fs.unlink(inputPath, () => {});
            if (fs.existsSync(outputPath)) fs.unlink(outputPath, () => {});
        });
    });
});
// ======================================================
// UNLOCK PDF
// ======================================================

app.post('/unlock', upload.single('pdfFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            error: 'Please upload a PDF file.'
        });
    }

    const inputPath = req.file.path;
    const outputPath = path.join(outputDir, `unlocked-${Date.now()}.pdf`);
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    const qpdfArgs = ['--decrypt'];

    if (password) {
        qpdfArgs.push(`--password=${password}`);
    }

    qpdfArgs.push(inputPath, outputPath);

    execFile('C:\\Program Files\\qpdf 12.4.2\\bin\\qpdf.exe', qpdfArgs, (error) => {
        if (error) {
            console.error('Unlock PDF processing failed:', error.message);

            if (fs.existsSync(inputPath)) fs.unlink(inputPath, () => {});
            if (fs.existsSync(outputPath)) fs.unlink(outputPath, () => {});

            const message = error.code === 'ENOENT'
                ? 'qpdf executable could not be found.'
                : 'Could not process this PDF. It may be corrupted or require the correct opening password.';

            return res.status(400).json({ error: message });
        }

        if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
            if (fs.existsSync(inputPath)) fs.unlink(inputPath, () => {});
            if (fs.existsSync(outputPath)) fs.unlink(outputPath, () => {});

            return res.status(500).json({
                error: 'Unlocking did not produce a valid output file.'
            });
        }

        res.download(outputPath, 'unlocked-document.pdf', () => {
            if (fs.existsSync(inputPath)) fs.unlink(inputPath, () => {});
            if (fs.existsSync(outputPath)) fs.unlink(outputPath, () => {});
        });
    });
});

// ======================================================
// START SERVER
// ======================================================

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
