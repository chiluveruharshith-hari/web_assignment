/**
 * CampusFind - Node.js Event Loop Demonstration Script
 * Demonstrates: Call Stack, Microtask Queue, Macrotask Queue (Timers, I/O, setImmediate)
 *
 * Expected Execution Order:
 * 1. Synchronous Main Thread execution
 * 2. process.nextTick (Microtask - highest priority)
 * 3. Promise microtasks (.then())
 * 4. setTimeout / setInterval (Timers phase)
 * 5. Asynchronous I/O callbacks (I/O Poll phase)
 * 6. setImmediate (Check phase)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('====================================================');
console.log('📘 Node.js Event Loop & Asynchronous I/O Demonstration');
console.log('====================================================\n');

// 1. Synchronous Code
console.log('Step 1: [SYNC] Main thread synchronous execution begins.');

// 2. Macrotask (Timers phase)
setTimeout(() => {
  console.log('Step 6: [MACROTASK - Timers Phase] setTimeout(0ms) callback executed.');
}, 0);

// 3. Macrotask (Check phase)
setImmediate(() => {
  console.log('Step 7: [MACROTASK - Check Phase] setImmediate callback executed.');
});

// 4. Microtask - process.nextTick
process.nextTick(() => {
  console.log('Step 3: [MICROTASK - nextTick] process.nextTick executed before other microtasks.');
});

// 5. Microtask - Promise resolution
Promise.resolve().then(() => {
  console.log('Step 4: [MICROTASK - Promise] Promise.then() resolved in microtask queue.');
});

// 6. Asynchronous Non-blocking I/O (File System)
const testFile = path.join(__dirname, 'temp-event-loop-test.txt');
fs.writeFile(testFile, 'Event Loop Test Data', (writeErr) => {
  if (writeErr) return console.error('Write error:', writeErr);

  console.log('Step 8: [ASYNC I/O - Poll Phase] fs.writeFile I/O completed.');

  fs.readFile(testFile, 'utf8', (readErr, data) => {
    if (readErr) return console.error('Read error:', readErr);
    console.log(`Step 9: [ASYNC I/O - Poll Phase] fs.readFile completed with content: "${data}".`);

    // Clean up temporary file
    fs.unlink(testFile, () => {
      console.log('Step 10: [CLEANUP] Temporary test file deleted.');
      console.log('\n====================================================');
      console.log('✅ Demonstration completed in proper Event Loop order.');
      console.log('====================================================');
    });
  });
});

// Synchronous End
console.log('Step 2: [SYNC] Main thread synchronous execution finished. Call stack now empty.');
console.log('         (Now the Node.js Event Loop starts draining queues...)\n');
