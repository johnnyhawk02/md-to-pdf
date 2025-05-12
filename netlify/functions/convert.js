const markdownpdf = require('markdown-pdf');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const multer = require('multer');
const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');

// Create an express app for the serverless function
const app = express();

// Enable CORS for all routes
app.use(cors());

// Handle OPTIONS requests directly in the handler to fix CORS issues
app.use((req, res, next) => {
  // Log request details for debugging
  console.log(`${req.method} request received to ${req.path}`);
  console.log('Headers:', JSON.stringify(req.headers));
  
  // Set CORS headers for all responses
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Content-Disposition');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Responding to OPTIONS request');
    return res.status(200).end();
  }
  
  next();
});

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

// Create a test endpoint to verify the function is working
app.get('/', (req, res) => {
  console.log("Test endpoint called");
  
  // Show environment info for debugging
  const env = {
    tempDir: os.tmpdir(),
    nodeEnv: process.env.NODE_ENV,
    netlifyDev: process.env.NETLIFY_DEV, 
    functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
    deployTimestamp: new Date().toISOString()
  };
  
  res.status(200).json({ 
    message: "Markdown to PDF Converter API is running",
    environment: env
  });
});

// Add a ping route for status checks
app.get('/ping', (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Create a specific route for the conversion
app.post('/convert', upload.single('markdown'), async (req, res) => {
  console.log("Convert endpoint called");
  
  try {
    if (!req.file) {
      console.log("No file uploaded");
      return res.status(400).json({ error: 'No markdown file uploaded' });
    }
    
    console.log("File received:", req.file.originalname);

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

    // Define possible paths for the CSS file
    let cssPathOptions = [
      path.join(__dirname, './public/css/pdf-style.css'),
      path.join(__dirname, '../public/css/pdf-style.css'),
      path.join(__dirname, '../../public/css/pdf-style.css'),
      path.join('/tmp/pdf-style.css')
    ];
    
    // Check which path exists
    let cssPath = null;
    for (const pathOption of cssPathOptions) {
      console.log(`Checking CSS path: ${pathOption} - exists: ${fs.existsSync(pathOption)}`);
      if (fs.existsSync(pathOption)) {
        cssPath = pathOption;
        break;
      }
    }
    
    // If no CSS file found, create a default one
    if (!cssPath) {
      const defaultCssPath = path.join(tempDir, 'pdf-style.css');
      const defaultCSS = `
        body { font-family: Arial, sans-serif; margin: 2cm; }
        h1, h2, h3 { color: #333; }
        pre { background: #f5f5f5; padding: 1em; border-radius: 3px; }
        code { font-family: monospace; }
      `;
      fs.writeFileSync(defaultCssPath, defaultCSS);
      cssPath = defaultCssPath;
      console.log(`Created default CSS at: ${defaultCssPath}`);
    }
    
    // PDF options for styling
    const options = {
      cssPath: cssPath,
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
      return res.status(500).json({ 
        error: 'Error generating PDF',
        message: err.message,
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
      });
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
    return res.status(500).json({ 
      error: 'Error converting markdown to PDF',
      message: error.message,
      details: {
        tempDir: os.tmpdir(),
        functionPath: __dirname
      }
    });
  }
});

// Export the serverless handler
module.exports.handler = serverless(app);
