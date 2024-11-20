const fs = require('fs');

function cleanUnusedNodes() {
    // Read the data file
    const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    
    // Helper function to check if node is a design
    function isDesign(node) {
        return /^\d{14}/.test(node.id) || node.id.includes('.jpg') || node.id.includes('.png');
    }

    // Helper function to check if node is an item
    function isItem(node) {
        return node.val === 2;
    }

    // Helper function to find all connected designs for a node
    function findConnectedDesigns(nodeId, visited = new Set()) {
        if (visited.has(nodeId)) return [];
        visited.add(nodeId);

        const connectedNodes = data.links
            .filter(link => 
                link.source === nodeId || 
                link.target === nodeId ||
                link.source.id === nodeId ||
                link.target.id === nodeId
            )
            .map(link => {
                const connectedId = (link.source === nodeId || link.source.id === nodeId) 
                    ? (typeof link.target === 'string' ? link.target : link.target.id)
                    : (typeof link.source === 'string' ? link.source : link.source.id);
                return data.nodes.find(n => n.id === connectedId);
            })
            .filter(node => node !== undefined);

        const designs = connectedNodes.filter(node => isDesign(node));
        const furtherDesigns = connectedNodes
            .filter(node => !isDesign(node))
            .flatMap(node => findConnectedDesigns(node.id, visited));

        return [...designs, ...furtherDesigns];
    }

    // Track statistics
    const stats = {
        originalNodes: data.nodes.length,
        originalLinks: data.links.length,
        removedTypes: 0,
        removedConcepts: 0
    };

    // Find nodes to remove (concepts and types without paths to designs)
    const nodesToRemove = data.nodes
        .filter(node => (node.type === 'type' || node.type === 'concept'))
        .filter(node => {
            const connectedDesigns = findConnectedDesigns(node.id);
            return connectedDesigns.length === 0;
        });

    // Create sets of IDs to remove
    const idsToRemove = new Set(nodesToRemove.map(node => node.id));

    // Count removed nodes by type
    nodesToRemove.forEach(node => {
        if (node.type === 'type') stats.removedTypes++;
        if (node.type === 'concept') stats.removedConcepts++;
    });

    // Filter nodes and links
    const newNodes = data.nodes.filter(node => !idsToRemove.has(node.id));
    const newLinks = data.links.filter(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        return !idsToRemove.has(sourceId) && !idsToRemove.has(targetId);
    });

    // Create cleaned data
    const cleanedData = {
        nodes: newNodes,
        links: newLinks
    };

    // Save backup of original data
    fs.writeFileSync('data.json.backup', JSON.stringify(data, null, 2));

    // Save cleaned data
    fs.writeFileSync('data.json', JSON.stringify(cleanedData, null, 2));

    // Print removed nodes
    console.log('=== Removed Nodes ===\n');
    console.log('Types removed:');
    nodesToRemove
        .filter(node => node.type === 'type')
        .forEach(node => console.log(`- ${node.id} (${node.name || 'No name'})`));

    console.log('\nConcepts removed:');
    nodesToRemove
        .filter(node => node.type === 'concept')
        .forEach(node => console.log(`- ${node.id} (${node.name || 'No name'})`));

    // Print statistics
    console.log('\n=== Statistics ===');
    console.log(`Original nodes: ${stats.originalNodes}`);
    console.log(`Original links: ${stats.originalLinks}`);
    console.log(`Types removed: ${stats.removedTypes}`);
    console.log(`Concepts removed: ${stats.removedConcepts}`);
    console.log(`Remaining nodes: ${newNodes.length}`);
    console.log(`Remaining links: ${newLinks.length}`);

    return stats;
}

try {
    const stats = cleanUnusedNodes();
    console.log('\nData cleanup complete!');
    console.log('Original data backed up to data.json.backup');
} catch (error) {
    console.error('Script failed:', error);
} 