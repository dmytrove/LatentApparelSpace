// migration.js

const fs = require('fs');

// Read the old JSON data
const oldData = JSON.parse(fs.readFileSync('old_data.json', 'utf8'));

// Initialize the new data structure with parent nodes
const newData = {
  nodes: [
    {
      id: "Types",
      name: "Clothes Types",
      img: "imgs/types.png",
      val: 4,
      group: "parent"
    },
    {
      id: "Concepts",
      name: "Concepts",
      val: 4,
      group: "parent"
    },
    {
      id: "Items",
      name: "Items",
      val: 4,
      group: "parent"
    }
  ],
  links: []
};

// Helper maps
const typeMap = {};
const conceptMap = {};
const itemMap = {};

// First pass: Create all nodes
oldData.nodes.forEach(node => {
  if (node.id === 'Types' || node.id === 'Concepts' || node.id === 'Items') {
    return; // Skip as we already added parent nodes
  }

  // Check if node is a type
  if (oldData.links.some(link => link.source === 'Types' && link.target === node.id)) {
    if (!typeMap[node.id]) {
      const typeNode = {
        id: node.id,
        name: node.name || node.id,
        img: node.img,
        val: node.val,
        group: "type"
      };
      typeMap[node.id] = typeNode;
      newData.nodes.push(typeNode);
      // Add link to Types parent
      newData.links.push({
        source: "Types",
        target: node.id
      });
    }
  }
  // Check if node is a concept
  else if (oldData.links.some(link => link.source === 'Concepts' && link.target === node.id)) {
    if (!conceptMap[node.id]) {
      const conceptNode = {
        id: node.id,
        name: node.name || node.id,
        img: node.img,
        val: node.val,
        group: "concept"
      };
      conceptMap[node.id] = conceptNode;
      newData.nodes.push(conceptNode);
      // Add link to Concepts parent
      newData.links.push({
        source: "Concepts",
        target: node.id
      });
    }
  }
  // Process items and designs
  else {
    const parentLink = oldData.links.find(link => link.target === node.id);
    if (parentLink) {
      const itemNode = {
        id: node.id,
        name: node.name || node.id,
        img: node.img,
        thmb: node.thmb,
        val: node.val,
        group: "item"
      };
      newData.nodes.push(itemNode);
      // Add link to parent
      newData.links.push({
        source: parentLink.source,
        target: node.id
      });
    }
  }
});

// Second pass: Process relationships between items, types, and concepts
oldData.links.forEach(link => {
  // Skip parent category links we already processed
  if (['Types', 'Concepts', 'Items'].includes(link.source)) {
    return;
  }

  // Add remaining relationships
  if (typeMap[link.target] || conceptMap[link.target]) {
    newData.links.push({
      source: link.source,
      target: link.target
    });
  }
});

// Write the new JSON file
fs.writeFileSync('new_data.json', JSON.stringify(newData, null, 2));

console.log('Migration completed. The new data has been saved to new_data.json');
