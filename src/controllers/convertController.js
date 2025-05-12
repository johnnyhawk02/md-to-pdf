const markdownpdf = require('markdown-pdf');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Controller for converting markdown to PDF
exports.convertMarkdownToPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No markdown file uploaded' });
    }

    // Generate a unique filename for the temporary markdown file
    const randomFilename = crypto.randomBytes(16).toString('hex');
    const mdFilePath = path.join(uploadDir, `${randomFilename}.md`);
    const pdfFilePath = path.join(uploadDir, `${randomFilename}.pdf`);
    
    // Get the original filename without extension for the output PDF
    const originalFilename = path.parse(req.file.originalname).name;
    
    // Write the markdown content to a temporary file
    fs.writeFileSync(mdFilePath, req.file.buffer);

    // PDF options for styling
    const options = {
      cssPath: path.join(__dirname, '../../public/css/pdf-style.css'),
      remarkable: {
        html: true,
        breaks: true,
        syntax: ['footnote', 'sup', 'sub']
      }
    };

    // Convert the markdown to PDF
    markdownpdf(options)
      .from(mdFilePath)
      .to(pdfFilePath, () => {
        // Send the PDF file back to the client
        res.download(pdfFilePath, `${originalFilename}.pdf`, (err) => {
          // Clean up temporary files after sending the response
          if (fs.existsSync(mdFilePath)) fs.unlinkSync(mdFilePath);
          if (fs.existsSync(pdfFilePath)) fs.unlinkSync(pdfFilePath);
          
          if (err) {
            console.error('Error sending file:', err);
            if (!res.headersSent) {
              return res.status(500).json({ error: 'Error sending PDF file' });
            }
          }
        });
      });
  } catch (error) {
    console.error('Conversion error:', error);
    return res.status(500).json({ error: 'Error converting markdown to PDF' });
  }
};
