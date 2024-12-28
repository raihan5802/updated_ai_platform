// backend/middleware/uploadMiddleware.js
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// 1) Configure multer to store files temporarily in 'temp_uploads'
const upload = multer({ dest: 'temp_uploads/' });

/**
 * moveUploadedFilesPreserveStructure
 *
 * For each file, we also have a matching relative path from 'req.body.paths' (the webkitRelativePath).
 * We parse that path, create the corresponding directories, and move the file.
 */
function moveUploadedFilesPreserveStructure(identifier, files, relativePaths) {
  // e.g. base dir: "ClientDataUpload/123"
  const baseDir = path.join(__dirname, '..', '..', 'ClientDataUpload', String(identifier));

  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  // We loop through 'files' and their corresponding 'relativePaths' in parallel.
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const tempPath = file.path;              // e.g. temp_uploads/88adfae3...
    const relPath = relativePaths[i];        // e.g. "folderA/subfolder/file.txt"

    // Parse out the directory and filename from relPath
    const { dir, base } = path.parse(relPath);
    // e.g. dir="folderA/subfolder", base="file.txt"

    // Create subdirectories under baseDir
    const targetDir = path.join(baseDir, dir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Move file to final location
    const newPath = path.join(targetDir, base); 
    fs.renameSync(tempPath, newPath);
  }
}

module.exports = {
  upload,
  moveUploadedFilesPreserveStructure
};
