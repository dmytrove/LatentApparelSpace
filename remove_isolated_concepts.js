const fs = require('fs');

function removeIsolatedConcepts() {
    // Read the data file
    const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    
    // Track removals
    const stats = {
        originalNodes: data.nodes.length,
        originalLinks: data.links.length,
        removedConcepts: []
    };

    // Find concepts that only link to "Concepts" node
    const conceptsToRemove = data.nodes
        .filter(node => {
            // Get all links for this concept
            const nodeLinks = data.links.filter(link => {
                const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
                const targetId = typeof link.target === 'string' ? link.target : link.target.id;
                return sourceId === node.id || targetId === node.id;
            });

            // Check if all links are only with "Concepts" node
            return nodeLinks.every(link => {
                const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
                const targetId = typeof link.target === 'string' ? link.target : link.target.id;
                const otherId = sourceId === node.id ? targetId : sourceId;
                return otherId === 'Concepts';
            });
        });

    // Create set of IDs to remove
    const idsToRemove = new Set(conceptsToRemove.map(node => node.id));

    // Filter nodes and links
    const newNodes = data.nodes.filter(node => !idsToRemove.has(node.id));
    const newLinks = data.links.filter(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        return !idsToRemove.has(sourceId) && !idsToRemove.has(targetId);
    });

    // Store removed concepts info
    stats.removedConcepts = conceptsToRemove.map(node => ({
        id: node.id,
        name: node.name || node.id
    }));

    // Create cleaned data
    const cleanedData = {
        nodes: newNodes,
        links: newLinks
    };

    // Print removed concepts
    console.log('=== Removed Isolated Concepts ===\n');
    console.log('The following concepts were only linked to the "Concepts" node:');
    stats.removedConcepts
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(concept => {
            console.log(`- ${concept.name} (${concept.id})`);
        });

    // Print statistics
    console.log('\n=== Statistics ===');
    console.log(`Original nodes: ${stats.originalNodes}`);
    console.log(`Original links: ${stats.originalLinks}`);
    console.log(`Concepts removed: ${stats.removedConcepts.length}`);
    console.log(`Remaining nodes: ${newNodes.length}`);
    console.log(`Remaining links: ${newLinks.length}`);

    // Save backup
    fs.writeFileSync('data.json.backup', JSON.stringify(data, null, 2));

    // Save cleaned data
    fs.writeFileSync('data.json', JSON.stringify(cleanedData, null, 2));

    return stats;
}

try {
    const stats = removeIsolatedConcepts();
    console.log('\nCleanup complete!');
    console.log('Original data backed up to data.json.backup');
} catch (error) {
    console.error('Script failed:', error);
} 