import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema(
  {
    asset_code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    description: String,
    manufacturer: String,
    model: String,
    serial_number: String,
    purchase_date: String,
    purchase_cost: { type: Number, default: 0 },
    supplier: String,
    warranty_expiry: String,
    expected_life_years: Number,
    location: String,
    department: String,
    custodian: String,
    lifecycle_stage: { type: String, default: 'PLANNED' },
    condition: { type: String, default: 'GOOD' },
    criticality: { type: String, default: 'MEDIUM' },
    installation_date: String,
    commissioning_date: String,
    retirement_date: String,
    notes: String
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export default mongoose.model('Asset', assetSchema);
