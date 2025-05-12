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
        handleError('Conversion failed');
      }
    });

    xhr.addEventListener('error', () => {
      handleError('Network error occurred');
    });

    xhr.addEventListener('abort', () => {
      handleError('Conversion aborted');
    });

    // Open and send the request
    xhr.open('POST', '/api/convert');
    xhr.responseType = 'blob';
    xhr.send(formData);
  }

  // Handle conversion errors
  function handleError(message) {
    progressText.textContent = message;
    progressBarInner.style.backgroundColor = '#e74c3c';
    
    // Reset UI after a delay
    setTimeout(() => {
      progress.classList.add('hidden');
      filePreview.classList.remove('hidden');
    }, 2000);
  }
});
