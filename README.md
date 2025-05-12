# Markdown to PDF Converter

A simple web application that allows you to convert Markdown (.md) files to good-looking PDF documents.

## Features

- Drag-and-drop interface for easy file uploading
- Elegant PDF formatting with custom styling
- Simple and intuitive user interface
- Immediate download of converted PDFs

## Technologies Used

- **Backend**: Node.js, Express
- **Frontend**: HTML, CSS, JavaScript
- **Conversion**: markdown-pdf (which uses PhantomJS)
- **File Handling**: multer

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/johnnyhawk02/md-to-pdf.git
   cd md-to-pdf
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the application:
   ```
   npm start
   ```

4. Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

## Deploying to Netlify

This application is configured to work with Netlify using serverless functions:

1. Push your code to GitHub (or another Git provider supported by Netlify)
2. Log in to Netlify and create a new site from Git
3. Select your repository and use these build settings:
   - Build command: `npm install`
   - Publish directory: `public`
4. Click "Deploy site"

The application will automatically use the serverless function for the conversion process when deployed to Netlify.

## Development

To run the application in development mode with automatic server restarts:

```
npm run dev
```

## Project Structure

```
md-to-pdf/
├── public/              # Static files
│   ├── css/             # CSS styles
│   ├── images/          # Images
│   ├── js/              # Client-side JavaScript
│   └── index.html       # Main HTML page
├── src/                 # Server-side code
│   ├── controllers/     # Request handlers
│   ├── routes/          # API routes
│   └── server.js        # Express application
├── uploads/             # Temporary files (created at runtime)
└── package.json         # Project dependencies and scripts
```

## How It Works

1. Upload a Markdown file through the web interface
2. The server processes the file using markdown-pdf
3. The generated PDF is sent back to the browser
4. The PDF is downloaded automatically

## License

MIT

## Acknowledgements

- [markdown-pdf](https://github.com/alanshaw/markdown-pdf) - For Markdown to PDF conversion
