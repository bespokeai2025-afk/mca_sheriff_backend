import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { Queue } from 'bullmq';
import express from 'express';

import dotenv from 'dotenv'

dotenv.config()
// Redis Configuration
import { redisConfig } from './config/redis'; // Your Redis config import
import { authenticateJWT } from './middlewares/auth.middleware';

// Initialize BullMQ Queue
const notificationQueue = new Queue('notificationQueue', {
    connection: redisConfig
});


// Initialize Bull Board
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
    queues: [new BullMQAdapter(notificationQueue)],
    serverAdapter
});

// Express App for Dashboard
const app = express();
app.use('/admin/queues', serverAdapter.getRouter());

// Start Server
const PORT = process.env.BULLBOARDPORT || 3004;
app.listen(PORT, () => {
    console.log(`🚀 BullMQ Dashboard running at http://localhost:${PORT}/admin/queues`);
});
