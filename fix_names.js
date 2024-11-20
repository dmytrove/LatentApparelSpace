const fs = require('fs');
const path = require('path');

// Helper function to convert to camelCase
function toCamelCase(str) {
    return str
        .replace(/[^a-zA-Z0-9]/g, ' ') // Replace non-alphanumeric with spaces
        .split(' ')
        .map((word, index) => {
            if (word.length === 0) return '';
            return index === 0 
                ? word.toLowerCase()
                : word.charAt(0).toUpperCase() + word.toLowerCase().slice(1);
        })
        .join('');
}

// Helper function to rename file if it exists
function renameFileIfExists(oldPath, newPath) {
    if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        return true;
    }
    return false;
}

// Read the data file
const dataPath = 'data.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Track all renames for logging
const renames = [];

// Process each node
data.nodes.forEach(node => {
    // Skip nodes without images
    if (!node.img) return;

    // Get the old paths
    const oldImgPath = node.img;
    const oldThmbPath = node.thmb;

    // Get file extension from old path
    const ext = path.extname(oldImgPath);

    // Generate new filename
    const oldFileName = path.basename(oldImgPath, ext);
    const newFileName = toCamelCase(oldFileName) + ext;

    // Update paths in the node
    const dirName = path.dirname(oldImgPath);
    const newImgPath = path.join(dirName, newFileName);
    node.img = newImgPath.replace(/\\/g, '/'); // Ensure forward slashes

    // Update thumbnail if it exists
    if (oldThmbPath) {
        const thmbDirName = path.dirname(oldThmbPath);
        const newThmbPath = path.join(thmbDirName, newFileName);
        node.thmb = newThmbPath.replace(/\\/g, '/');
    }

    // Rename the actual files
    const renamed = renameFileIfExists(oldImgPath, newImgPath);
    if (renamed) {
        renames.push(`${oldImgPath} -> ${newImgPath}`);
    }

    if (oldThmbPath) {
        const renamedThmb = renameFileIfExists(oldThmbPath, node.thmb);
        if (renamedThmb) {
            renames.push(`${oldThmbPath} -> ${node.thmb}`);
        }
    }
});

// Save the updated data file
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

// Log all changes
console.log('Files renamed:');
renames.forEach(rename => console.log(rename));
console.log(`\nTotal files renamed: ${renames.length}`);
console.log('\ndata.json has been updated with new paths');

// Create a backup of the original data
fs.writeFileSync(dataPath + '.backup', JSON.stringify(data, null, 2));
console.log('\nBackup created: data.json.backup'); 