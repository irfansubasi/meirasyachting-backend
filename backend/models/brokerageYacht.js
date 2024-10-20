import mongoose from 'mongoose';

const brokerageSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  type: {
    tr: { type: String, required: true },
    en: { type: String, required: true },
  },
  length: { type: Number, required: true },
  people: { type: Number, required: true },
  location: { type: String, required: true },
  images: { type: Number, required: true },
  features: {
    tr: { type: [String] },
    en: { type: [String] },
  },
});

const Brokerage = mongoose.model('Brokerage', brokerageSchema, 'brokerage');

export default Brokerage;
