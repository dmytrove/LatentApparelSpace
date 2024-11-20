const fs = require('fs');

function displayHierarchy() {
    const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    
    // Helper function to check if node is a design
    function isDesign(node) {
        return /^\d{14}/.test(node.id) || node.id.includes('.jpg') || node.id.includes('.png');
    }

    // Helper function to get node by id
    function getNode(id) {
        return data.nodes.find(n => n.id === (typeof id === 'string' ? id : id.id));
    }

    // Helper function to get children of a node
    function getChildren(nodeId) {
        return data.links
            .filter(link => {
                const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
                return sourceId === nodeId;
            })
            .map(link => {
                const targetId = typeof link.target === 'string' ? link.target : link.target.id;
                return getNode(targetId);
            })
            .filter(node => node !== undefined);
    }

    // Helper function to print tree
    function printTree(node, level = 0, visited = new Set()) {
        if (visited.has(node.id)) {
            console.log('  '.repeat(level) + `${node.name || node.id} (circular reference)`);
            return;
        }
        
        visited.add(node.id);
        
        // Print current node
        const prefix = '  '.repeat(level);
        const nodeType = node.type || (isDesign(node) ? 'design' : 'item');
        const suffix = nodeType === 'design' ? '' : ` [${nodeType}]`;
        console.log(prefix + `${node.name || node.id}${suffix}`);

        // Get and sort children
        const children = getChildren(node.id);
        
        // Sort children: types first, then concepts, then items, then designs
        const sortedChildren = children.sort((a, b) => {
            const typeOrder = { type: 1, concept: 2, item: 3, design: 4 };
            const aType = a.type || (isDesign(a) ? 'design' : 'item');
            const bType = b.type || (isDesign(b) ? 'design' : 'item');
            return typeOrder[aType] - typeOrder[bType] || (a.name || a.id).localeCompare(b.name || b.id);
        });

        // Print children
        sortedChildren.forEach(child => {
            printTree(child, level + 1, new Set(visited));
        });
    }

    // Find root nodes (nodes with no parents or only category parents)
    const rootNodes = data.nodes.filter(node => {
        const parents = data.links
            .filter(link => {
                const targetId = typeof link.target === 'string' ? link.target : link.target.id;
                return targetId === node.id;
            })
            .map(link => {
                const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
                return getNode(sourceId);
            })
            .filter(node => node !== undefined);

        return parents.length === 0 || parents.every(p => p.type === 'category');
    });

    // Sort root nodes
    const sortedRoots = rootNodes.sort((a, b) => {
        const typeOrder = { type: 1, concept: 2, item: 3, design: 4 };
        const aType = a.type || (isDesign(a) ? 'design' : 'item');
        const bType = b.type || (isDesign(b) ? 'design' : 'item');
        return typeOrder[aType] - typeOrder[bType] || (a.name || a.id).localeCompare(b.name || b.id);
    });

    // Print hierarchy
    console.log('=== Graph Hierarchy ===\n');
    sortedRoots.forEach(root => {
        printTree(root);
        console.log(''); // Empty line between root trees
    });

    // Print statistics
    const stats = {
        total: data.nodes.length,
        types: data.nodes.filter(n => n.type === 'type').length,
        concepts: data.nodes.filter(n => n.type === 'concept').length,
        items: data.nodes.filter(n => n.val === 2).length,
        designs: data.nodes.filter(n => isDesign(n)).length,
        roots: sortedRoots.length,
        links: data.links.length
    };

    console.log('=== Statistics ===');
    console.log(`Total nodes: ${stats.total}`);
    console.log(`Types: ${stats.types}`);
    console.log(`Concepts: ${stats.concepts}`);
    console.log(`Items: ${stats.items}`);
    console.log(`Designs: ${stats.designs}`);
    console.log(`Root nodes: ${stats.roots}`);
    console.log(`Total links: ${stats.links}`);

    return stats;
}

try {
    displayHierarchy();
} catch (error) {
    console.error('Script failed:', error);
} 