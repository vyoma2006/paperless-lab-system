const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    labId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab', required: true },
    // New field to track the specific experiment
    experimentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Experiment', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    studentName: { type: String, required: true },
    observations: { type: String, required: true },
    status: { type: String, default: 'Pending' },
    grade: { type: Number, default: 0 },
    feedback: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Submission', submissionSchema);