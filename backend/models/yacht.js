import mongoose from 'mongoose';

const yachtSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  length: { type: Number, required: true },
  people: { type: Number, required: true },
  cabin: { type: Number, required: true },
  location: { type: String, required: true },
  images: { type: Number, required: true },
  features: [{ type: String }],
});

const Yacht = mongoose.model('Yacht', yachtSchema);

export default Yacht;
