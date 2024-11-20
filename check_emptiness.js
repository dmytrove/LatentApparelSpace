const fs = require('fs');

function analyzeEmptinessNode() {
    // Read the data file
    const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    
    // Find Emptiness node
    const emptinessNode = data.nodes.find(node => node.id === 'Emptiness');
    
    if (!emptinessNode) {
        console.log('Emptiness node not found in nodes!');
        return;
    }
    
    console.log('\nEmptiness Node Details:');
    console.log(JSON.stringify(emptinessNode, null, 2));

    // Find all links where Emptiness is source
    const sourceLinks = data.links.filter(link => link.source === 'Emptiness' || link.source.id === 'Emptiness');
    console.log('\nLinks where Emptiness is source:', sourceLinks.length);
    sourceLinks.forEach(link => {
        console.log(`- Links to: ${typeof link.target === 'object' ? link.target.id : link.target}`);
    });

    // Find all links where Emptiness is target
    const targetLinks = data.links.filter(link => link.target === 'Emptiness' || link.target.id === 'Emptiness');
    console.log('\nLinks where Emptiness is target:', targetLinks.length);
    targetLinks.forEach(link => {
        console.log(`- Linked from: ${typeof link.source === 'object' ? link.source.id : link.source}`);
    });

    // Check for potential issues
    console.log('\nPotential Issues:');
    
    // Check if links use string IDs or object references
    const hasStringLinks = data.links.some(link => typeof link.source === 'string' || typeof link.target === 'string');
    const hasObjectLinks = data.links.some(link => typeof link.source === 'object' || typeof link.target === 'object');
    
    if (hasStringLinks && hasObjectLinks) {
        console.log('- WARNING: Mixed link formats (both string IDs and object references)');
    }

    // Check for case sensitivity
    const similarNodes = data.nodes.filter(node => 
        node.id.toLowerCase().includes('emptiness') || 
        node.name.toLowerCase().includes('emptiness')
    );
    
    if (similarNodes.length > 1) {
        console.log('- WARNING: Multiple nodes with similar names:');
        similarNodes.forEach(node => console.log(`  * ${node.id} (${node.name})`));
    }

    // Suggest related concepts that should be linked
    const suggestedLinks = ['Fog', 'Mist', 'Cloud', 'Gas', 'Void', 'Space'];
    console.log('\nSuggested connections to check:');
    suggestedLinks.forEach(concept => {
        const exists = data.nodes.some(node => node.id === concept);
        console.log(`- ${concept}: ${exists ? 'exists in nodes' : 'not found'}`);
        
        if (exists) {
            const hasLink = data.links.some(link => 
                (link.source === 'Emptiness' && link.target === concept) ||
                (link.source === concept && link.target === 'Emptiness') ||
                (link.source.id === 'Emptiness' && link.target.id === concept) ||
                (link.source.id === concept && link.target.id === 'Emptiness')
            );
            if (!hasLink) {
                console.log(`  * Missing link with ${concept}`);
            }
        }
    });
}

try {
    analyzeEmptinessNode();
} catch (error) {
    console.error('Script failed:', error);
} 