// Read the data file
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

// Helper function to check if a node is a design (has timestamp ID)
function isDesign(nodeId) {
    return /^\d{14}/.test(nodeId) || nodeId.includes('.jpg') || nodeId.includes('.png');
}

// Create filtered nodes list (excluding designs)
const relevantNodes = data.nodes.filter(node => !isDesign(node.id));

// Create a map of all nodes that are targets
const hasParent = new Set();
data.links.forEach(link => {
    if (!isDesign(link.target)) {
        hasParent.add(link.target);
    }
});

// Create a map of all nodes that are sources
const hasChild = new Set();
data.links.forEach(link => {
    if (!isDesign(link.source)) {
        hasChild.add(link.source);
    }
});

// Find nodes without children (sources)
console.log("Nodes without children (excluding designs):");
relevantNodes
    .filter(node => !hasChild.has(node.id))
    .sort((a, b) => a.id.localeCompare(b.id))
    .forEach(node => {
        console.log(`- ${node.id} (${node.name})`);
    });

// Find nodes without parents (targets)
console.log("\nNodes without parents (excluding designs):");
relevantNodes
    .filter(node => !hasParent.has(node.id))
    .sort((a, b) => a.id.localeCompare(b.id))
    .forEach(node => {
        console.log(`- ${node.id} (${node.name})`);
    });

// Find completely disconnected nodes (no parents or children)
console.log("\nCompletely disconnected nodes (excluding designs):");
relevantNodes
    .filter(node => !hasParent.has(node.id) && !hasChild.has(node.id))
    .sort((a, b) => a.id.localeCompare(b.id))
    .forEach(node => {
        console.log(`- ${node.id} (${node.name})`);
    });

// Print some statistics
const totalNonDesigns = relevantNodes.length;
const noChildren = relevantNodes.filter(node => !hasChild.has(node.id)).length;
const noParents = relevantNodes.filter(node => !hasParent.has(node.id)).length;
const disconnected = relevantNodes.filter(node => !hasParent.has(node.id) && !hasChild.has(node.id)).length;

console.log("\nStatistics (excluding designs):");
console.log(`Total concept/type nodes: ${totalNonDesigns}`);
console.log(`Nodes without children: ${noChildren}`);
console.log(`Nodes without parents: ${noParents}`);
console.log(`Completely disconnected nodes: ${disconnected}`);

// Optional: Print count of design nodes
const designNodes = data.nodes.filter(node => isDesign(node.id)).length;
console.log(`\nNumber of design nodes (excluded from search): ${designNodes}`);
