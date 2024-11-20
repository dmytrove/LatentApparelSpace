const fs = require('fs');

function removeEmptyConcepts() {
    // Read the data file
    const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    
    // Track removals
    const stats = {
        originalNodes: data.nodes.length,
        originalLinks: data.links.length,
        removedConcepts: []
    };

    // Find concepts without children
    const conceptsToRemove = data.nodes
        .filter(node => node.type === 'concept')
        .filter(node => {
            // Check if concept has any outgoing links
            const hasChildren = data.links.some(link => {
                const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
                return sourceId === node.id;
            });
            return !hasChildren;
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
        name: node.name || node.id,
        parents: data.links
            .filter(link => {
                const targetId = typeof link.target === 'string' ? link.target : link.target.id;
                return targetId === node.id;
            })
            .map(link => {
                const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
                const parentNode = data.nodes.find(n => n.id === sourceId);
                return parentNode ? (parentNode.name || parentNode.id) : sourceId;
            })
    }));

    // Create cleaned data
    const cleanedData = {
        nodes: newNodes,
        links: newLinks
    };

    // Print removed concepts
    console.log('=== Removed Empty Concepts ===\n');
    stats.removedConcepts
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(concept => {
            console.log(`- ${concept.name}`);
            if (concept.parents.length > 0) {
                console.log(`  Parents: ${concept.parents.join(', ')}`);
            }
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
    const stats = removeEmptyConcepts();
    console.log('\nCleanup complete!');
    console.log('Original data backed up to data.json.backup');
} catch (error) {
    console.error('Script failed:', error);
} 