const fs = require('fs');
const path = require('path');

// Read and export the JSON string from a file
function readJsonAsString(filePath) {
  try {
    const fullPath = path.resolve(__dirname, filePath);
    const data = fs.readFileSync(fullPath, 'utf8');
    // Validate JSON
    JSON.parse(data); // Will throw if invalid
    return data;
  } catch (err) {
    console.error('Error reading or parsing JSON file:', err.message);
    return null;
  }
}
function writeJsonToFile(filePath, data) {
  try {
    const fullPath = path.resolve(__dirname, filePath);
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    fs.writeFileSync(fullPath, jsonString, 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing JSON file:', err.message);
    return false;
  }
}

function appendJsonToFile(filePath, newData) {
  try {
    const fullPath = path.resolve(__dirname, filePath);
    console.log(fullPath);

    // Read current content or start with empty array
    let existingData = [];
    if (fs.existsSync(fullPath)) {
      const raw = fs.readFileSync(fullPath, 'utf8');
      existingData = JSON.parse(raw);
    }

    // Ensure existing content is an array
    if (!Array.isArray(existingData)) {
      throw new Error('Existing JSON is not an array.');
    }

    // Append new data
    if (Array.isArray(newData)) {
      existingData.push(...newData);
    } else {
      existingData.push(newData);
    }

    // Write updated array back to file
    fs.writeFileSync(fullPath, JSON.stringify(existingData, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error appending to JSON file:', err.message);
    return false;
  }
}
module.exports = {
  readJsonAsString,
  writeJsonToFile,
  appendJsonToFile,
};
