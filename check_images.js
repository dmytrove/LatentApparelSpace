const fs = require('fs');
const path = require('path');

// Read the data file
const data = JSON.parse(fs.readFileSync('new_data.json', 'utf8'));

// Sample image to use as stub
const SAMPLE_IMAGE = 'imgs/sample.jpg';

// Ensure base directories exist
const directories = [
    'imgs',
    'imgs/Types',
    'imgs/Concepts',
    'imgs/Items',
    'imgs/Designs',
    'imgs/Thumbnails'
];

directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Helper function to check and copy file if missing
function ensureImageExists(imgPath) {
    if (!imgPath) return;

    const fullPath = path.join(__dirname, imgPath);
    const directory = path.dirname(fullPath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }

    // If image doesn't exist, copy sample image
    if (!fs.existsSync(fullPath)) {
        console.log(`Missing image: ${imgPath} - creating stub`);
        fs.copyFileSync(SAMPLE_IMAGE, fullPath);
    }
}

// Check all images in the data
function checkImages() {
    // Check types
    data.types.forEach(type => {
        ensureImageExists(type.img);
    });

    // Check concepts
    data.concepts.forEach(concept => {
        ensureImageExists(concept.img);
    });

    // Check items and their designs
    data.items.forEach(item => {
        ensureImageExists(item.img);
        
        item.designs.forEach(design => {
            ensureImageExists(design.img);
            ensureImageExists(design.thmb);
        });
    });
}

// Create sample image if it doesn't exist
if (!fs.existsSync(SAMPLE_IMAGE)) {
    console.log('Creating sample image...');
    // Create a simple 100x100 black PNG
    const { createCanvas } = require('canvas');
    const canvas = createCanvas(100, 100);
    const ctx = canvas.getContext('2d');
    
    // Fill with gray
    ctx.fillStyle = '#888888';
    ctx.fillRect(0, 0, 100, 100);
    
    // Add text
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Sample', 50, 45);
    ctx.fillText('Image', 50, 65);
    
    // Save the image
    const buffer = canvas.toBuffer('image/jpeg');
    fs.writeFileSync(SAMPLE_IMAGE, buffer);
}

// Run the check
checkImages();
console.log('Image check complete!');
