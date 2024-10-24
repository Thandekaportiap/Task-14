const http = require('http');
const fs = require('fs');
const path = require('path');

// File path to shopping list JSON
const filePath = path.join(__dirname, 'data', 'shoppingList.json');

// Function to initialize file and directory if not present
const initializeFile = () => {
    if (!fs.existsSync('data')) {
        fs.mkdirSync('data');
    }
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify([])); // Start with empty array
    }
};

// Function to read shopping list from JSON file
const readShoppingList = () => {
    initializeFile();
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
};

// Function to write updated shopping list to JSON file
const writeShoppingList = (list) => {
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2)); // Pretty format JSON
};

// Create the server
const server = http.createServer((req, res) => {
    // Retrieve the shopping list (GET /shopping-list)
    if (req.method === 'GET' && req.url === '/shopping-list') {
        const list = readShoppingList();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(list));
    }

    // Add a new item to the shopping list (POST /shopping-list)
    else if (req.method === 'POST' && req.url === '/shopping-list') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            const newItem = JSON.parse(body);
            const list = readShoppingList();

            // Validate item: name should not be empty and quantity must be positive
            if (!newItem.name || typeof newItem.quantity !== 'number' || newItem.quantity <= 0) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'Invalid input. Name must be non-empty and quantity must be positive.' }));
            }

            list.push(newItem);
            writeShoppingList(list);

            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Item added', item: newItem }));
        });
    }

    // Update an item in the shopping list (PUT /shopping-list/:index)
    else if (req.method === 'PUT' && req.url.startsWith('/shopping-list/')) {
        let body = '';
        const index = parseInt(req.url.split('/').pop(), 10);
        const list = readShoppingList();

        if (isNaN(index) || index < 0 || index >= list.length) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Item not found' }));
        }

        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            const updatedItem = JSON.parse(body);

            // Validate item
            if (!updatedItem.name || typeof updatedItem.quantity !== 'number' || updatedItem.quantity <= 0) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'Invalid input. Name must be non-empty and quantity must be positive.' }));
            }

            list[index] = updatedItem; // Update the item
            writeShoppingList(list);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Item updated', item: updatedItem }));
        });
    }

    // Delete an item from the shopping list (DELETE /shopping-list/:index)
    else if (req.method === 'DELETE' && req.url.startsWith('/shopping-list/')) {
        const index = parseInt(req.url.split('/').pop(), 10);
        const list = readShoppingList();

        if (isNaN(index) || index < 0 || index >= list.length) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Item not found' }));
        }

        const deletedItem = list.splice(index, 1); // Remove item at the specified index
        writeShoppingList(list);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Item deleted', item: deletedItem }));
    }

    // Handle unknown routes
    else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Route not found' }));
    }
});

// Start the server
const PORT = 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
