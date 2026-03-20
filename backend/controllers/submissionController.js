const Submission = require('../models/Submission');

// 1. IMPROVED: Handles both Initial Submission and Resubmissions (Upsert)
exports.submitLab = async (req, res) => {
    try {
        const { labId, experimentId, studentId, studentName, observations } = req.body;

        // Search by unique triplet: Lab + Experiment + Student
        // This prevents multiple rows for the same task
        const submission = await Submission.findOneAndUpdate(
            { labId, experimentId, studentId }, 
            { 
                studentName, 
                observations, 
                status: 'Pending', // Resets status so Faculty sees it in "Action Required"
                updatedAt: new Date() 
            },
            { new: true, upsert: true } // Create if doesn't exist, Update if it does
        );

        res.status(201).json(submission);
    } catch (err) {
        res.status(400).json({ message: "Error during submission", error: err.message });
    }
};

// 2. FIXED: Now actually updates 'observations' when Faculty or Student patches the record
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        // Destructure observations so the "Redo" text actually saves
        const { status, grade, feedback, observations } = req.body;
        
        const updatedSubmission = await Submission.findByIdAndUpdate(
            id, 
            { 
                status, 
                grade, 
                feedback, 
                observations, 
                updatedAt: new Date() 
            }, 
            { new: true }
        );

        if (!updatedSubmission) {
            return res.status(404).json({ message: "Submission record not found" });
        }

        res.json(updatedSubmission);
    } catch (err) {
        res.status(400).json({ message: "Error updating status", error: err.message });
    }
};

// 3. Get all submissions (General Admin/Overview)
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

// 4. Fetch specific submission for the Lab Manual view
exports.getStudentSubmission = async (req, res) => {
    try {
        const { labId, studentId, experimentId } = req.params;
        const submission = await Submission.findOne({ labId, studentId, experimentId });
        res.json(submission);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 5. Fetch submissions for a specific Lab (Faculty View)
exports.getSubmissionsByLab = async (req, res) => {
    try {
        const { labId } = req.params;
        const submissions = await Submission.find({ labId })
            .populate('labId')
            .populate('experimentId')
            .populate('studentId', 'name studentId email') 
            .sort({ updatedAt: -1 }); // Sort by latest update so Redos appear at the top

        res.json(submissions);
    } catch (err) {
        res.status(500).json({ message: "Error fetching lab submissions", error: err.message });
    }
};

// 6. Fetch all submissions for one student (Performance Tab)
exports.getStudentAllSubmissions = async (req, res) => {
    try {
        const { studentId } = req.params;
        
        const submissions = await Submission.find({ studentId })
            .populate('labId', 'title instructor') 
            .populate('experimentId', 'title aim')
            .sort({ updatedAt: -1 });

        res.status(200).json(submissions);
    } catch (error) {
        res.status(500).json({ message: "Error fetching student performance data", error });
    }
};