# Install PhantomJS for markdown-pdf
echo "Installing Phantom.js prerequisites..."

# Make sure we have sudo access
if ! [ -x "$(command -v sudo)" ]; then
  echo "Setting up environmental requirements for PhantomJS"
  
  # For Netlify's Ubuntu environment
  apt-get update
  apt-get install -y fontconfig libfreetype6 libpng-dev libjpeg-dev
  
  # Copy CSS files to ensure they are accessible to the serverless function
  mkdir -p netlify/functions/public/css
  cp -f public/css/pdf-style.css netlify/functions/public/css/
else
  # For local development environment
  echo "Running in local environment, skipping package installation"
  mkdir -p netlify/functions/public/css
  cp -f public/css/pdf-style.css netlify/functions/public/css/
fi

# Make the function directory executable
chmod -R 755 netlify/functions/

echo "Environment setup completed"
