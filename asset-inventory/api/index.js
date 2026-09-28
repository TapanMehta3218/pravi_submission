import app from '../server/app.js';
import { connectDB } from '../server/db/mongodb.js';

// Ensure MongoDB is connected for Vercel Serverless Functions
connectDB().catch(err => console.error('MongoDB connection error:', err));

export default app;
