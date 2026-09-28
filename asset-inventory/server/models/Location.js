import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    type: String,
    address: String,
    city: String,
    state: String,
    country: { type: String, default: 'India' }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export default mongoose.model('Location', locationSchema);
