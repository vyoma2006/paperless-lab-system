const Submission = require('../models/Submission');

exports.submitLab = async (req, res) => {
    try {
        // 1. Added experimentId to the request body destructuring
        const { labId, experimentId, studentId, studentName, observations } = req.body;
        const newSubmission = await Submission.create({
            labId,
            experimentId, // Saving the specific experiment reference
            studentId,
            studentName,
            observations
        });
        res.status(201).json(newSubmission);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getSubmissions = async (req, res) => {
    try {
        // We MUST populate labId to access the instructorId for filtering
        const submissions = await Submission.find()
            .populate('labId') 
            .populate('experimentId'); 
        res.json(submissions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, grade, feedback } = req.body; // Catch feedback here
        const updatedSubmission = await Submission.findByIdAndUpdate(
            id, 
            { status, grade, feedback }, 
            { new: true }
        );
        res.json(updatedSubmission);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getStudentSubmission = async (req, res) => {
    try {
        // 3. Updated to check for a specific experiment submission
        const { labId, studentId, experimentId } = req.params;
        const submission = await Submission.findOne({ labId, studentId, experimentId });
        res.json(submission);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};