<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Markdown to PDF Converter Instructions

This is a Node.js Express application that converts Markdown files to PDF documents. The application uses the following key technologies:

- Express.js for the backend server
- markdown-pdf for Markdown to PDF conversion
- Multer for file upload handling
- Custom CSS for styling both the web interface and the generated PDFs

Key files:
- `src/server.js` - The main Express application
- `src/controllers/convertController.js` - Controller for handling the conversion logic
- `src/routes/index.js` - API routes
- `public/index.html` - Main frontend page
- `public/js/app.js` - Frontend JavaScript for file handling and API interaction
- `public/css/style.css` - Styles for the web interface
- `public/css/pdf-style.css` - Styles applied to the generated PDF documents
