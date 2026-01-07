const multer = require("multer");
const path = require("path");
const fs = require("fs");

const createUploadMiddleware = (folderName) => {
  // Define the upload path relative to this file (api/middleware/upload.js)
  // This ensures it always points to api/uploads/{folderName}
  const uploadPath = path.join(__dirname, "../uploads", folderName);

  // Ensure the directory exists
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      // Create a unique filename to prevent overwrites
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });

  return multer({ storage: storage });
};

module.exports = createUploadMiddleware;
