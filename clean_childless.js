const fs = require('fs');

function cleanChildlessNodes() {
    // Read the data file
    const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    
    // Track statistics
    const stats = {
        originalNodes: data.nodes.length,
        originalLinks: data.links.length,
        removedTypes: 0,
        removedConcepts: 0
    };

    // Find nodes to remove (concepts and types without children)
    const nodesToRemove = data.nodes
        .filter(node => (node.type === 'type' || node.type === 'concept'))
        .filter(node => {
            // Check if node has any outgoing links
            const hasChildren = data.links.some(link => {
                const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
                return sourceId === node.id;
            });
            return !hasChildren;
        });

    // Create set of IDs to remove
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

    // Print removed nodes
    console.log('=== Removed Childless Nodes ===\n');
    console.log('Types removed:');
    nodesToRemove
        .filter(node => node.type === 'type')
        .sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id))
        .forEach(node => {
            const parentLinks = data.links
                .filter(link => {
                    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
                    return targetId === node.id;
                })
                .map(link => {
                    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
                    const parentNode = data.nodes.find(n => n.id === sourceId);
                    return parentNode ? (parentNode.name || parentNode.id) : sourceId;
                });
            console.log(`- ${node.id} (${node.name || 'No name'}) - Parents: ${parentLinks.join(', ') || 'None'}`);
        });

    console.log('\nConcepts removed:');
    nodesToRemove
        .filter(node => node.type === 'concept')
        .sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id))
        .forEach(node => {
            const parentLinks = data.links
                .filter(link => {
                    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
                    return targetId === node.id;
                })
                .map(link => {
                    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
                    const parentNode = data.nodes.find(n => n.id === sourceId);
                    return parentNode ? (parentNode.name || parentNode.id) : sourceId;
                });
            console.log(`- ${node.id} (${node.name || 'No name'}) - Parents: ${parentLinks.join(', ') || 'None'}`);
        });

    // Print statistics
    console.log('\n=== Statistics ===');
    console.log(`Original nodes: ${stats.originalNodes}`);
    console.log(`Original links: ${stats.originalLinks}`);
    console.log(`Types removed: ${stats.removedTypes}`);
    console.log(`Concepts removed: ${stats.removedConcepts}`);
    console.log(`Remaining nodes: ${newNodes.length}`);
    console.log(`Remaining links: ${newLinks.length}`);

    // Save backup of original data
    fs.writeFileSync('data.json.backup', JSON.stringify(data, null, 2));

    // Save cleaned data
    fs.writeFileSync('data.json', JSON.stringify(cleanedData, null, 2));

    return stats;
}

try {
    const stats = cleanChildlessNodes();
    console.log('\nData cleanup complete!');
    console.log('Original data backed up to data.json.backup');
} catch (error) {
    console.error('Script failed:', error);
} 