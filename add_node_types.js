const fs = require('fs');

function addNodeTypes() {
    // Read the data file
    const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    
    // Helper function to check if node is a design
    function isDesign(node) {
        return /^\d{14}/.test(node.id) || node.id.includes('.jpg') || node.id.includes('.png');
    }

    // Track changes
    const stats = {
        updated: 0,
        unchanged: 0,
        types: new Map()
    };

    // Process each node
    data.nodes = data.nodes.map(node => {
        let nodeType = node.type;

        // Determine node type if not already set
        if (!nodeType) {
            if (isDesign(node)) {
                nodeType = 'design';
            } else if (node.val === 2) {
                nodeType = 'item';
            } else {
                // Check connections to determine type
                const isParentOfDesign = data.links.some(link => {
                    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
                    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
                    return sourceId === node.id && isDesign(data.nodes.find(n => n.id === targetId));
                });

                if (isParentOfDesign) {
                    nodeType = 'item';
                }
            }
        }

        // Update statistics
        if (nodeType !== node.type) {
            stats.updated++;
            console.log(`Updated: ${node.id} (${node.name || 'No name'}) - Type: ${nodeType || 'undefined'}`);
        } else {
            stats.unchanged++;
        }

        // Update type count
        stats.types.set(nodeType || 'undefined', (stats.types.get(nodeType || 'undefined') || 0) + 1);

        return {
            ...node,
            type: nodeType
        };
    });

    // Save backup
    fs.writeFileSync('data.json.backup', JSON.stringify(data, null, 2));

    // Save updated data
    fs.writeFileSync('data.json', JSON.stringify(data, null, 2));

    // Print statistics
    console.log('\n=== Update Statistics ===');
    console.log(`Nodes updated: ${stats.updated}`);
    console.log(`Nodes unchanged: ${stats.unchanged}`);
    console.log('\nNode types:');
    Array.from(stats.types.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([type, count]) => {
            console.log(`${type}: ${count} nodes`);
        });

    return stats;
}

try {
    const stats = addNodeTypes();
    console.log('\nUpdate complete!');
    console.log('Original data backed up to data.json.backup');
} catch (error) {
    console.error('Script failed:', error);
} 