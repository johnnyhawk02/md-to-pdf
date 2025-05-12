const markdownpdf = require('markdown-pdf');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const multer = require('multer');
const express = require('express');
const serverless = require('serverless-http');

// Create an express app for the serverless function
const app = express();

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

// Function to generate temporary directory for file operations
function getTempDir() {
  // In Netlify functions, we need to use the /tmp directory for file operations
  const tempDir = path.join(os.tmpdir(), 'md-to-pdf-' + crypto.randomBytes(8).toString('hex'));
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
}

// Create a specific route for the conversion
app.post('/convert', upload.single('markdown'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No markdown file uploaded' });
    }

    // Get a temporary directory for this conversion
    const tempDir = getTempDir();
    
    // Generate a unique filename for the temporary markdown file
    const randomFilename = crypto.randomBytes(16).toString('hex');
    const mdFilePath = path.join(tempDir, `${randomFilename}.md`);
    const pdfFilePath = path.join(tempDir, `${randomFilename}.pdf`);
    
    // Get the original filename without extension for the output PDF
    const originalFilename = path.parse(req.file.originalname).name;
    
    // Write the markdown content to a temporary file
    fs.writeFileSync(mdFilePath, req.file.buffer);

    // PDF options for styling
    const options = {
      cssPath: path.join(__dirname, './public/css/pdf-style.css'),
      remarkable: {
        html: true,
        breaks: true,
        syntax: ['footnote', 'sup', 'sub']
      }
    };

    // Convert the markdown to PDF using Promise
    try {
      await new Promise((resolve, reject) => {
        markdownpdf(options)
          .from(mdFilePath)
          .to(pdfFilePath, (err) => {
            if (err) return reject(err);
            resolve();
          });
      });
      
      // Read the PDF file into memory
      const pdfData = fs.readFileSync(pdfFilePath);
      
      // Set the appropriate headers
      res.contentType('application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${originalFilename}.pdf"`);
      
      // Send the PDF data
      res.send(pdfData);
      
    } catch (err) {
      console.error('PDF generation error:', err);
      return res.status(500).json({ error: 'Error generating PDF' });
    } finally {
      // Clean up temporary files
      try {
        if (fs.existsSync(mdFilePath)) fs.unlinkSync(mdFilePath);
        if (fs.existsSync(pdfFilePath)) fs.unlinkSync(pdfFilePath);
        fs.rmdirSync(tempDir, { recursive: true });
      } catch (cleanupErr) {
        console.error('Error cleaning up temp files:', cleanupErr);
      }
    }
  } catch (error) {
    console.error('Conversion error:', error);
    return res.status(500).json({ error: 'Error converting markdown to PDF' });
  }
});

// Export the serverless handler
module.exports.handler = serverless(app);
