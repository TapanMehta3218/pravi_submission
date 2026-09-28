import mongoose from 'mongoose';

const maintenanceRecordSchema = new mongoose.Schema(
  {
    asset_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
    maintenance_type: { type: String, required: true },
    title: { type: String, required: true },
    description: String,
    scheduled_date: String,
    completed_date: String,
    technician: String,
    vendor: String,
    cost: { type: Number, default: 0 },
    status: { type: String, default: 'SCHEDULED' },
    findings: String,
    action_taken: String
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export default mongoose.model('MaintenanceRecord', maintenanceRecordSchema);
