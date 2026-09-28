import mongoose from 'mongoose';

const assetEventSchema = new mongoose.Schema(
  {
    asset_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
    event_type: { type: String, required: true },
    title: { type: String, required: true },
    description: String,
    old_value: String,
    new_value: String,
    performed_by: { type: String, default: 'System' }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export default mongoose.model('AssetEvent', assetEventSchema);
