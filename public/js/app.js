document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const dropArea = document.getElementById('drop-area');
  const fileInput = document.getElementById('file-input');
  const filePreview = document.getElementById('file-preview');
  const fileName = document.getElementById('file-name');
  const removeFileBtn = document.getElementById('remove-file');
  const convertBtn = document.getElementById('convert-button');
  const progress = document.getElementById('progress');
  const progressBarInner = document.getElementById('progress-bar-inner');
  const progressText = document.getElementById('progress-text');

  // Selected file
  let selectedFile = null;

  // Prevent default drag behaviors
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });

  // Highlight drop area when item is dragged over it
  ['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
  });

  // Handle dropped files
  dropArea.addEventListener('drop', handleDrop, false);

  // Handle file input change
  fileInput.addEventListener('change', handleFileSelect);

  // Handle remove file button
  removeFileBtn.addEventListener('click', removeFile);

  // Handle convert button
  convertBtn.addEventListener('click', convertToPDF);

  // Click on drop area triggers file input
  dropArea.addEventListener('click', () => {
    fileInput.click();
  });

  // Prevent defaults for drag and drop
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function highlight() {
    dropArea.classList.add('active');
  }

  function unhighlight() {
    dropArea.classList.remove('active');
  }

  // Process dropped files
  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
      processFile(files[0]);
    }
  }

  // Process selected files from file input
  function handleFileSelect() {
    if (fileInput.files.length > 0) {
      processFile(fileInput.files[0]);
    }
  }

  // Process the uploaded file
  function processFile(file) {
    // Check if file is markdown
    if (!file.name.toLowerCase().endsWith('.md') && file.type !== 'text/markdown') {
      alert('Please upload a valid Markdown (.md) file.');
      return;
    }
    
    // Store selected file
    selectedFile = file;
    
    // Update UI
    fileName.textContent = file.name;
    dropArea.classList.add('hidden');
    filePreview.classList.remove('hidden');
  }

  // Remove selected file
  function removeFile() {
    selectedFile = null;
    fileInput.value = '';
    filePreview.classList.add('hidden');
    dropArea.classList.remove('hidden');
  }

  // Convert markdown to PDF
  function convertToPDF() {
    if (!selectedFile) {
      alert('Please select a Markdown file first.');
      return;
    }

    // Create form data for the upload
    const formData = new FormData();
    formData.append('markdown', selectedFile);

    // Show progress UI
    progress.classList.remove('hidden');
    filePreview.classList.add('hidden');
    progressBarInner.style.width = '0%';
    progressText.textContent = 'Converting...';

    // Send request to convert the file
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        progressBarInner.style.width = percent + '%';
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        progressText.textContent = 'Download starting...';
        progressBarInner.style.width = '100%';
        
        // Check if the response is actually a PDF
        const contentType = xhr.getResponseHeader('Content-Type');
        if (!contentType || !contentType.includes('application/pdf')) {
          try {
            // Try to parse as JSON error
            const errorResponse = JSON.parse(new TextDecoder().decode(xhr.response));
            handleError('Conversion failed', errorResponse);
            return;
          } catch (e) {
            // Not JSON, continue with download
          }
        }
        
        // Handle the PDF file download
        const blob = xhr.response;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        const filename = selectedFile.name.replace('.md', '.pdf');
        
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // Reset UI after a short delay
        setTimeout(() => {
          progress.classList.add('hidden');
          dropArea.classList.remove('hidden');
          selectedFile = null;
          fileInput.value = '';
        }, 1500);
      } else {
        try {
          // Try to parse as JSON error
          const errorResponse = JSON.parse(new TextDecoder().decode(xhr.response));
          handleError(`Conversion failed: ${xhr.status}`, errorResponse);
        } catch (e) {
          handleError(`Conversion failed: ${xhr.status}`);
        }
      }
    });

    xhr.addEventListener('error', () => {
      handleError(`Network error occurred. The API endpoint may be unavailable.`, 
        `Could not connect to ${apiUrl}. Please check:\n` +
        `1. If you're connected to the internet\n` +
        `2. Visit the status page using the link in the footer\n` +
        `3. Try accessing ${window.location.origin}/.netlify/functions/debug directly to check if functions are working`
      );
    });

    xhr.addEventListener('abort', () => {
      handleError('Conversion aborted');
    });

    // Open and send the request
    // Always use Netlify's proper functions path in production
    let apiUrl;
    if (window.location.hostname === 'localhost') {
      apiUrl = '/api/convert';
    } else {
      // Always use Netlify's direct functions path in production
      apiUrl = '/.netlify/functions/convert';
      console.log('Using Netlify functions path:', apiUrl);
    }
    
    // No fallback, always use the proper path
    xhr.open('POST', apiUrl);
    xhr.responseType = 'blob';
    xhr.send(formData);
    
    // Log for debugging purposes
    console.log('Sending request to:', apiUrl);
  }
  
  // Function for future diagnostics if needed
  function logEndpointInfo(url) {
    console.log(`Using API endpoint: ${url}`);
    console.log(`Full URL: ${window.location.origin}${url}`);
  }

  // Get error container elements
  const errorContainer = document.getElementById('error-container');
  const errorMessage = document.getElementById('error-message');
  const closeError = document.getElementById('close-error');
  
  // Close error button
  closeError.addEventListener('click', () => {
    errorContainer.classList.add('hidden');
  });
  
  // Handle conversion errors
  function handleError(message, details = null) {
    progressText.textContent = message;
    progressBarInner.style.backgroundColor = '#e74c3c';
    
    console.error('Conversion error:', message);
    
    // Prepare error details
    let errorDetails = '';
    
    if (details) {
      console.error('Error details:', details);
      errorDetails = typeof details === 'object' ? JSON.stringify(details, null, 2) : details;
    } else {
      errorDetails = `Error: ${message}\n\nTroubleshooting tips:\n` +
        `1. Check if the Netlify function is accessible at: ${window.location.origin}/.netlify/functions/convert\n` +
        `2. Check if the Debug function works: ${window.location.origin}/.netlify/functions/debug\n` +
        `3. Check your browser console for more details\n` +
        `4. Try a different browser\n` +
        `5. If using adblocker, try disabling it`;
    }
    
    // Show the error container with details
    errorMessage.textContent = errorDetails;
    errorContainer.classList.remove('hidden');
    
    // Reset UI after a delay
    setTimeout(() => {
      progress.classList.add('hidden');
      filePreview.classList.remove('hidden');
    }, 2000);
  }
});
