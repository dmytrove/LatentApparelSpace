const fs = require('fs');

function removeIsolatedTypes() {
    // Read the data file
    const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    
    // Track removals
    const stats = {
        originalNodes: data.nodes.length,
        originalLinks: data.links.length,
        removedTypes: []
    };

    // Find types that only link to "Types" node
    const typesToRemove = data.nodes
        .filter(node => node.val === 2) // Types have val=2
        .filter(node => {
            // Get all links for this type
            const nodeLinks = data.links.filter(link => {
                const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
                const targetId = typeof link.target === 'string' ? link.target : link.target.id;
                return sourceId === node.id || targetId === node.id;
            });

            // Check if all links are only with "Types" node
            return nodeLinks.every(link => {
                const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
                const targetId = typeof link.target === 'string' ? link.target : link.target.id;
                const otherId = sourceId === node.id ? targetId : sourceId;
                return otherId === 'Types';
            });
        });

    // Create set of IDs to remove
    const idsToRemove = new Set(typesToRemove.map(node => node.id));

    // Filter nodes and links
    const newNodes = data.nodes.filter(node => !idsToRemove.has(node.id));
    const newLinks = data.links.filter(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        return !idsToRemove.has(sourceId) && !idsToRemove.has(targetId);
    });

    // Store removed types info
    stats.removedTypes = typesToRemove.map(node => ({
        id: node.id,
        name: node.name || node.id
    }));

    // Create cleaned data
    const cleanedData = {
        nodes: newNodes,
        links: newLinks
    };

    // Print removed types
    console.log('=== Removed Isolated Types ===\n');
    console.log('The following types were only linked to the "Types" node:');
    stats.removedTypes
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(type => {
            console.log(`- ${type.name} (${type.id})`);
        });

    // Print statistics
    console.log('\n=== Statistics ===');
    console.log(`Original nodes: ${stats.originalNodes}`);
    console.log(`Original links: ${stats.originalLinks}`);
    console.log(`Types removed: ${stats.removedTypes.length}`);
    console.log(`Remaining nodes: ${newNodes.length}`);
    console.log(`Remaining links: ${newLinks.length}`);

    // Save backup
    fs.writeFileSync('data.json.backup', JSON.stringify(data, null, 2));

    // Save cleaned data
    fs.writeFileSync('data.json', JSON.stringify(cleanedData, null, 2));

    return stats;
}

try {
    const stats = removeIsolatedTypes();
    console.log('\nCleanup complete!');
    console.log('Original data backed up to data.json.backup');
} catch (error) {
    console.error('Script failed:', error);
} 