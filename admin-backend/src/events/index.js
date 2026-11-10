// src/events/index.js
// Importing this module wires the event bus to the BullMQ producers.
// Add `import '@src/events/index.js';` to the service entrypoint once.
import { registerEventProducers } from '@src/events/producers/queue.producer.js';

registerEventProducers();
