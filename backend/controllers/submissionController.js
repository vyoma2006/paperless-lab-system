const Submission = require('../models/Submission');

exports.submitLab = async (req, res) => {
    try {
        const { labId, experimentId, studentId, studentName, observations } = req.body;
        const newSubmission = await Submission.create({
            labId,
            experimentId,
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
        const { status, grade, feedback } = req.body;
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
        const { labId, studentId, experimentId } = req.params;
        const submission = await Submission.findOne({ labId, studentId, experimentId });
        res.json(submission);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getSubmissionsByLab = async (req, res) => {
    try {
        const { labId } = req.params;
        const submissions = await Submission.find({ labId })
            .populate('labId')
            .populate('experimentId')
            .sort({ createdAt: -1 });

        res.json(submissions);
    } catch (err) {
        res.status(500).json({ message: "Error fetching lab submissions", error: err.message });
    }
};