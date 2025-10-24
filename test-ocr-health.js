#!/usr/bin/env node
/**
 * OCR Service Health Check and Integration Test
 * Tests FastAPI endpoints: /health, /ocr/tesseract, /ocr/azure
 */

// Get OCR service URL from env or default to container app
const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || 
  'https://cardiology-ocr-app.politesky-ff2385f1.eastus.azurecontainerapps.io';

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('   OCR SERVICE HEALTH CHECK');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log(`Service URL: ${OCR_SERVICE_URL}\n`);

// Test 1: Health endpoint
console.log('📊 TEST 1: Health Endpoint\n');
try {
  const response = await fetch(`${OCR_SERVICE_URL}/health`, {
    method: 'GET',
    signal: AbortSignal.timeout(10000)
  });

  if (response.ok) {
    const data = await response.json();
    console.log('✅ PASS - Health endpoint is responding');
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));
  } else {
    console.log(`❌ FAIL - Health endpoint returned error`);
    console.log(`   Status: ${response.status} ${response.statusText}`);
  }
} catch (error) {
  console.log('❌ FAIL - Cannot reach health endpoint');
  console.log(`   Error: ${error.message}`);
  if (error.name === 'AbortError' || error.name === 'TimeoutError') {
    console.log('   Reason: Request timed out after 10 seconds');
  }
}

// Test 2: Root endpoint (FastAPI auto-generated docs redirect)
console.log('\n\n📊 TEST 2: API Documentation\n');
try {
  const response = await fetch(`${OCR_SERVICE_URL}/docs`, {
    method: 'GET',
    redirect: 'manual',
    signal: AbortSignal.timeout(10000)
  });

  if (response.ok || response.status === 200) {
    console.log('✅ PASS - API docs available at /docs');
    console.log(`   Status: ${response.status}`);
  } else if (response.status === 307 || response.status === 308) {
    console.log('✅ PASS - API docs redirect configured');
    console.log(`   Redirect to: ${response.headers.get('location')}`);
  } else {
    console.log(`⚠️  SKIP - Docs endpoint returned ${response.status}`);
  }
} catch (error) {
  console.log('⚠️  SKIP - Cannot reach docs endpoint');
  console.log(`   Error: ${error.message}`);
}

// Test 3: Tesseract OCR endpoint (requires image upload)
console.log('\n\n📊 TEST 3: Tesseract OCR Endpoint\n');

// Create a simple test image (1x1 white PNG)
const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
const testImageBuffer = Buffer.from(testImageBase64, 'base64');

try {
  const formData = new FormData();
  const blob = new Blob([testImageBuffer], { type: 'image/png' });
  formData.append('file', blob, 'test.png');

  const response = await fetch(`${OCR_SERVICE_URL}/ocr/tesseract`, {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(30000)
  });

  if (response.ok) {
    const data = await response.json();
    console.log('✅ PASS - Tesseract OCR endpoint is working');
    console.log(`   Status: ${response.status}`);
    console.log(`   Method: ${data.method || 'tesseract'}`);
    console.log(`   Text extracted: ${data.text?.length || 0} characters`);
  } else {
    console.log(`❌ FAIL - Tesseract OCR endpoint returned error`);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    const errorText = await response.text();
    console.log(`   Error: ${errorText.substring(0, 200)}`);
  }
} catch (error) {
  console.log('❌ FAIL - Cannot reach Tesseract OCR endpoint');
  console.log(`   Error: ${error.message}`);
}

// Test 4: Azure Form Recognizer OCR endpoint
console.log('\n\n📊 TEST 4: Azure Form Recognizer OCR Endpoint\n');
try {
  const formData = new FormData();
  const blob = new Blob([testImageBuffer], { type: 'image/png' });
  formData.append('file', blob, 'test.png');

  const response = await fetch(`${OCR_SERVICE_URL}/ocr/azure`, {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(30000)
  });

  if (response.ok) {
    const data = await response.json();
    console.log('✅ PASS - Azure OCR endpoint is working');
    console.log(`   Status: ${response.status}`);
    console.log(`   Method: ${data.method || 'azure_form_recognizer'}`);
    console.log(`   Pages processed: ${data.pages || 0}`);
    console.log(`   Text extracted: ${data.text?.length || 0} characters`);
  } else if (response.status === 503) {
    console.log('⚠️  SKIP - Azure Form Recognizer not configured');
    console.log('   This is expected if FORM_RECOGNIZER_KEY is not set');
  } else {
    console.log(`❌ FAIL - Azure OCR endpoint returned error`);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    const errorText = await response.text();
    console.log(`   Error: ${errorText.substring(0, 200)}`);
  }
} catch (error) {
  console.log('❌ FAIL - Cannot reach Azure OCR endpoint');
  console.log(`   Error: ${error.message}`);
}

// Summary
console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('   TEST SUMMARY');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('To deploy or update the OCR service:');
console.log('  pwsh deploy-ocr-to-aca.ps1\n');
console.log('To test with a real medical document:');
console.log('  curl -X POST \\');
console.log(`    ${OCR_SERVICE_URL}/ocr/tesseract \\`);
console.log('    -F "file=@path/to/medical-document.pdf"\n');
