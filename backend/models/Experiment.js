const mongoose = require('mongoose');

const experimentSchema = new mongoose.Schema({
    labId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab', required: true },
    title: { type: String, required: true }, // e.g., "Exp 1: Logic Gates"
    aim: { type: String, required: true },
    procedure: { type: String },
    resources: { type: String } // Links to PDFs or videos
}, { timestamps: true });

module.exports = mongoose.model('Experiment', experimentSchema);