const mongoose = require('mongoose');

const labSchema = new mongoose.Schema({
    title: { type: String, required: true }, // e.g., "Digital Electronics"
    code: { type: String, required: true, unique: true },
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Lab', labSchema);