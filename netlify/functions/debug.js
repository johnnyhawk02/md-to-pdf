// Simple debug function to check environment
const path = require('path');
const os = require('os');
const fs = require('fs');

exports.handler = async (event, context) => {
  // Always enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Handle OPTIONS requests for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // Collect environment info
    const environmentInfo = {
      node_version: process.version,
      platform: process.platform,
      arch: process.arch,
      temp_dir: os.tmpdir(),
      function_dir: __dirname,
      env_vars: {
        NODE_ENV: process.env.NODE_ENV,
        AWS_LAMBDA_FUNCTION_NAME: process.env.AWS_LAMBDA_FUNCTION_NAME,
        NETLIFY: process.env.NETLIFY,
        CONTEXT: process.env.CONTEXT
      }
    };
    
    // Check file system access
    const testDir = path.join(os.tmpdir(), 'debug-test-' + Date.now());
    const testFile = path.join(testDir, 'test.txt');
    let fsTests = {};
    
    try {
      // Test directory creation
      fs.mkdirSync(testDir, { recursive: true });
      fsTests.dirCreated = fs.existsSync(testDir);
      
      // Test file writing
      fs.writeFileSync(testFile, 'Hello World');
      fsTests.fileWritten = fs.existsSync(testFile);
      
      // Test file reading
      fsTests.fileContent = fs.readFileSync(testFile, 'utf8');
      
      // Clean up
      fs.unlinkSync(testFile);
      fs.rmdirSync(testDir);
    } catch (fsError) {
      fsTests.error = fsError.message;
    }
    
    // Check module paths
    const modulePaths = module.paths;
    
    // Response with all debug info
    return {
      statusCode: 200,
      headers: { 
        ...headers,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: environmentInfo,
        fs_tests: fsTests,
        module_paths: modulePaths
      }, null, 2)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 
        ...headers,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ 
        status: 'error', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };
  }
};
