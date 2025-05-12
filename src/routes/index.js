const express = require('express');
const router = express.Router();
const convertController = require('../controllers/convertController');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Limit file size to 10MB
  },
  fileFilter: (req, file, cb) => {
    // Accept only markdown files
    if (file.mimetype === 'text/markdown' || file.originalname.endsWith('.md')) {
      cb(null, true);
    } else {
      cb(new Error('Only markdown files are allowed!'), false);
    }
  }
});

// Routes
router.post('/convert', upload.single('markdown'), convertController.convertMarkdownToPDF);

module.exports = router;
