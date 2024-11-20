const fs = require('fs');
const path = require('path');

// Helper function to check if node is a design
function isDesign(node) {
    return /^\d{14}/.test(node.id) || node.id.includes('.jpg') || node.id.includes('.png');
}

// Helper function to get random element from array
function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Main function to process the data
function setItemImages() {
    // Read the data file
    const dataPath = 'data.json';
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // Track statistics
    const stats = {
        processed: 0,
        updated: 0,  // Counter for items that had images updated
        noDesigns: 0
    };

    // Process each node
    data.nodes.forEach(node => {
        // Skip if node is a design
        if (isDesign(node)) {
            return;
        }

        // Find all design children
        const designChildren = data.links
            .filter(link => link.source === node)
            .map(link => data.nodes.find(n => n.id === link.target))
            .filter(childNode => childNode && isDesign(childNode) && childNode.img);

        if (designChildren.length === 0) {
            stats.noDesigns++;
            console.log(`No designs found for ${node.id}`);
            return;
        }

        // Select random design
        const selectedDesign = getRandomElement(designChildren);

        // Track if this is an update or new assignment
        const hadExistingImages = node.img && node.thmb;

        // Set item's images to the selected design's images
        node.img = selectedDesign.img;
        node.thmb = selectedDesign.thmb;

        if (hadExistingImages) {
            stats.updated++;
            console.log(`Updated images for ${node.id} from design ${selectedDesign.id}`);
        } else {
            stats.processed++;
            console.log(`Set new images for ${node.id} from design ${selectedDesign.id}`);
        }
    });

    // Save the updated data file
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    fs.writeFileSync(`${dataPath}.backup`, JSON.stringify(data, null, 2));

    return stats;
}

// Run the script
try {
    const stats = setItemImages();
    console.log('\nProcess complete!');
    console.log(`Items with new images: ${stats.processed}`);
    console.log(`Items with updated images: ${stats.updated}`);
    console.log(`Items with no designs: ${stats.noDesigns}`);
    console.log(`Total items processed: ${stats.processed + stats.updated}`);
    console.log('\ndata.json has been updated');
    console.log('Backup created: data.json.backup');
} catch (error) {
    console.error('Script failed:', error);
} 