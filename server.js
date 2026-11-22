const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFile } = require("child_process");
const { pathToFileURL } = require("url");

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;
const TEMP_DIR = path.join(os.tmpdir(), "allinone-uploads");

const LIBREOFFICE_PATHS = [
    "/usr/bin/libreoffice",
    "/usr/bin/soffice",
    "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
    "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe"
];

fs.mkdirSync(TEMP_DIR, { recursive: true });

const upload = multer({
    dest: TEMP_DIR,
    limits: {
        fileSize: 50 * 1024 * 1024
    }
});

function findLibreOffice() {
    for (const executable of LIBREOFFICE_PATHS) {
        if (fs.existsSync(executable)) {
            return executable;
        }
    }
    return null;
}

// Serve website files
app.use(express.static(ROOT_DIR));

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "AllInOne backend is running" });
});

// Word to PDF
app.post("/convert", upload.single("wordFile"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            error: "Please upload a Word document."
        });
    }

    const inputPath = req.file.path;
    const originalName = req.file.originalname;
    const extension = path.extname(originalName).toLowerCase();

    if (![".doc", ".docx"].includes(extension)) {
        fs.unlink(inputPath, () => {});
        return res.status(400).json({
            error: "Only DOC and DOCX files are supported."
        });
    }

    const libreOffice = findLibreOffice();

    if (!libreOffice) {
        fs.unlink(inputPath, () => {});
        return res.status(500).json({
            error: "LibreOffice is not installed."
        });
    }

    const jobId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const jobDir = path.join(TEMP_DIR, jobId);
    const outputDir = path.join(jobDir, "output");
    const profileDir = path.join(jobDir, "profile");

    fs.mkdirSync(outputDir, { recursive: true });
    fs.mkdirSync(profileDir, { recursive: true });

    const outputPath = path.join(outputDir, `${path.basename(inputPath)}.pdf`);
    const profileURL = pathToFileURL(profileDir).href;

    const args = [
        "--headless",
        "--nologo",
        "--nodefault",
        "--nolockcheck",
        `-env:UserInstallation=${profileURL}`,
        "--convert-to",
        "pdf",
        "--outdir",
        outputDir,
        inputPath
    ];

    console.log("Conversion started:", originalName);

    execFile(libreOffice, args, { timeout: 120000 }, (error, stdout, stderr) => {
        function cleanup() {
            fs.rm(jobDir, { recursive: true, force: true }, () => {});
            fs.unlink(inputPath, () => {});
        }

        if (error) {
            console.error("Conversion error:", stderr || error.message);
            cleanup();

            return res.status(500).json({
                error: "Conversion failed. Please try another Word document."
            });
        }

        if (!fs.existsSync(outputPath)) {
            console.error("PDF output missing:", stdout, stderr);
            cleanup();

            return res.status(500).json({
                error: "PDF could not be generated."
            });
        }

        const downloadName = path.basename(originalName, extension) + ".pdf";

        res.download(outputPath, downloadName, (downloadError) => {
            if (downloadError) {
                console.error("Download error:", downloadError.message);
            }
            cleanup();
        });
    });
});

// Handle upload errors
app.use((error, req, res, next) => {
    console.error("Server error:", error.message);

    if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
            error: "File exceeds the 50 MB limit."
        });
    }

    res.status(500).json({
        error: "Server error while processing the request."
    });
});

// Start server
const server = app.listen(PORT, "0.0.0.0", () => {
    console.log("------------------------------------");
    console.log("AllInOne backend is running!");
    console.log(`Server listening on port ${PORT}`);
    console.log("------------------------------------");
});

server.on("error", (error) => {
    console.error("Server startup error:", error.message);
});

console.log("Node process is active and initializing...");