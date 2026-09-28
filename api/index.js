import app from '../asset-inventory/server/app.js';
import { connectDB } from '../asset-inventory/server/db/mongodb.js';

connectDB().catch(err => console.error('MongoDB connection error:', err));

export default app;
