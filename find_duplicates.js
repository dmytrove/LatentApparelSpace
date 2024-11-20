const fs = require('fs');

function findDuplicates() {
    const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
    
    // Tracking maps
    const nameMap = new Map();
    const idMap = new Map();
    const normalizedNameMap = new Map();
    const normalizedIdMap = new Map();
    const partialIdMatches = new Map();

    // Statistics
    const stats = {
        totalNodes: data.nodes.length,
        exactNameDupes: 0,
        exactIdDupes: 0,
        similarNames: 0,
        similarIds: 0,
        partialIdMatches: 0
    };

    // Helper function to normalize text
    function normalizeText(text) {
        return text.toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .trim();
    }

    // Helper function to find partial ID matches
    function findPartialMatches(id1, id2) {
        const norm1 = normalizeText(id1);
        const norm2 = normalizeText(id2);
        return norm1.includes(norm2) || norm2.includes(norm1);
    }

    // Process each node
    data.nodes.forEach(node => {
        // Exact matches
        if (node.name) {
            if (!nameMap.has(node.name)) nameMap.set(node.name, []);
            nameMap.get(node.name).push(node);
        }
        
        if (!idMap.has(node.id)) idMap.set(node.id, []);
        idMap.get(node.id).push(node);

        // Normalized matches
        if (node.name) {
            const normName = normalizeText(node.name);
            if (!normalizedNameMap.has(normName)) normalizedNameMap.set(normName, []);
            normalizedNameMap.get(normName).push(node);
        }

        const normId = normalizeText(node.id);
        if (!normalizedIdMap.has(normId)) normalizedIdMap.set(normId, []);
        normalizedIdMap.get(normId).push(node);
    });

    // Find partial ID matches
    const nodeIds = Array.from(idMap.keys());
    for (let i = 0; i < nodeIds.length; i++) {
        for (let j = i + 1; j < nodeIds.length; j++) {
            if (findPartialMatches(nodeIds[i], nodeIds[j])) {
                const key = `${nodeIds[i]} ↔ ${nodeIds[j]}`;
                partialIdMatches.set(key, [
                    idMap.get(nodeIds[i])[0],
                    idMap.get(nodeIds[j])[0]
                ]);
            }
        }
    }

    // Print results
    console.log('=== Duplicate Analysis Report ===\n');

    // Exact name duplicates
    console.log('1. Exact Name Duplicates:');
    nameMap.forEach((nodes, name) => {
        if (nodes.length > 1) {
            stats.exactNameDupes++;
            console.log(`\nName "${name}" appears ${nodes.length} times:`);
            nodes.forEach(node => {
                console.log(`- ID: ${node.id}, Type: ${node.type || 'N/A'}`);
            });
        }
    });

    // Exact ID duplicates
    console.log('\n2. Exact ID Duplicates:');
    idMap.forEach((nodes, id) => {
        if (nodes.length > 1) {
            stats.exactIdDupes++;
            console.log(`\nID "${id}" appears ${nodes.length} times:`);
            nodes.forEach(node => {
                console.log(`- Name: ${node.name || 'N/A'}, Type: ${node.type || 'N/A'}`);
            });
        }
    });

    // Similar names
    console.log('\n3. Similar Names (case-insensitive, ignoring spaces):');
    normalizedNameMap.forEach((nodes, normName) => {
        if (nodes.length > 1) {
            stats.similarNames++;
            console.log(`\nSimilar names found (normalized: "${normName}"):`);
            nodes.forEach(node => {
                console.log(`- Name: "${node.name}", ID: ${node.id}, Type: ${node.type || 'N/A'}`);
            });
        }
    });

    // Similar IDs
    console.log('\n4. Similar IDs (case-insensitive, ignoring spaces):');
    normalizedIdMap.forEach((nodes, normId) => {
        if (nodes.length > 1) {
            stats.similarIds++;
            console.log(`\nSimilar IDs found (normalized: "${normId}"):`);
            nodes.forEach(node => {
                console.log(`- ID: "${node.id}", Name: ${node.name || 'N/A'}, Type: ${node.type || 'N/A'}`);
            });
        }
    });

    // Partial ID matches
    console.log('\n5. Partial ID Matches:');
    partialIdMatches.forEach((nodes, match) => {
        stats.partialIdMatches++;
        console.log(`\nPotential match found: ${match}`);
        nodes.forEach(node => {
            console.log(`- Name: ${node.name || 'N/A'}, Type: ${node.type || 'N/A'}`);
        });
    });

    // Statistics
    console.log('\n=== Statistics ===');
    console.log(`Total nodes: ${stats.totalNodes}`);
    console.log(`Groups with exact name duplicates: ${stats.exactNameDupes}`);
    console.log(`Groups with exact ID duplicates: ${stats.exactIdDupes}`);
    console.log(`Groups with similar names: ${stats.similarNames}`);
    console.log(`Groups with similar IDs: ${stats.similarIds}`);
    console.log(`Partial ID matches found: ${stats.partialIdMatches}`);

    // Suggestions
    if (Object.values(stats).some(val => val > 0)) {
        console.log('\n=== Suggested Fixes ===');
        console.log('1. Exact duplicates must be fixed:');
        console.log('   - Generate unique IDs');
        console.log('   - Merge duplicate nodes if they represent the same concept');
        console.log('2. Similar names/IDs should be reviewed:');
        console.log('   - Check for typos');
        console.log('   - Standardize naming conventions');
        console.log('   - Consider merging similar concepts');
        console.log('3. Partial matches might indicate:');
        console.log('   - Redundant nodes');
        console.log('   - Naming convention inconsistencies');
        console.log('   - Need for hierarchical organization');
    }

    return stats;
}

try {
    const stats = findDuplicates();
    if (Object.values(stats).every(val => val === 0 || val === stats.totalNodes)) {
        console.log('\nNo duplicates or similar items found! The data structure looks clean.');
    }
} catch (error) {
    console.error('Script failed:', error);
} 