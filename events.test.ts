// events.test.ts
import { eventManager } from './events';

// Define a test handler function
function testHandler(data: string) {
  console.log(`Test handler received data: ${data}`);
}

// Define another test handler to demonstrate the once functionality
function onceHandler(data: string) {
  console.log(`Once handler received data: ${data}`);
}

// Add testHandler to 'testEvent'
eventManager.on('testEvent', testHandler);

// Add onceHandler to 'onceEvent' and ensure it only runs once
eventManager.once('onceEvent', onceHandler);

// Emit 'testEvent' twice
console.log('Emitting testEvent...');
eventManager.emit('testEvent', 'Hello, World!');
eventManager.emit('testEvent', 'Hello again, World!');

// Emit 'onceEvent' twice
console.log('Emitting onceEvent...');
eventManager.emit('onceEvent', 'This should appear once.');
eventManager.emit('onceEvent', 'This should not trigger the handler again.');

// Optional: Generate and log the workflow roadmap
console.log(eventManager.generateWorkflowRoadmap());


// Test handlers with detailed logging
function orderPlacedHandler(orderId: string) {
  console.log(`Order placed handler triggered for order ID: ${orderId}`);
}

function inventoryUpdateHandler(orderId: string, itemCount: number) {
  console.log(`Inventory update handler triggered for order ID: ${orderId} with item count: ${itemCount}`);
}


// Register handlers with metadata
console.log('registering new events handlers');
eventManager.on('orderPlaced', orderPlacedHandler, {
  description: 'Handles order placement',
  dependencies: ['database', 'emailService']
});

eventManager.on('inventoryUpdate', inventoryUpdateHandler, {
  description: 'Updates inventory based on order',
  dependencies: ['inventoryService']
});

// Register a once handler
eventManager.once('orderPlaced', onceHandler);

// Emit events
console.log('Emitting orderPlaced...');
eventManager.emit('orderPlaced', '12345');
eventManager.emit('orderPlaced', '12346'); // This should also trigger the onceHandler only for the first emit

console.log('Emitting inventoryUpdate...');
eventManager.emit('inventoryUpdate', '12345', 10);

// Generate and log the workflow roadmap
console.log(eventManager.generateWorkflowRoadmap());

// Remove a handler and test
eventManager.off('inventoryUpdate', inventoryUpdateHandler);
console.log('Emitting inventoryUpdate after removing handler...');
eventManager.emit('inventoryUpdate', '12345', 5); // This should not trigger any log

// Generate and log the workflow roadmap
console.log(eventManager.generateWorkflowRoadmap());
