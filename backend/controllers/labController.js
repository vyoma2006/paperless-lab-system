const Lab = require('../models/Lab');
const User = require('../models/User'); // 1. Import User model to update enrollment

// 1. Create a lab tied to a specific Faculty ID
exports.createLab = async (req, res) => {
    try {
        const { title, code, instructor, instructorId, description } = req.body;
        const newLab = await Lab.create({ 
            title, 
            code, 
            instructor, 
            instructorId, 
            description 
        });
        res.status(201).json(newLab);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// 2. Get ONLY the labs created by a specific faculty
exports.getFacultyLabs = async (req, res) => {
    try {
        const { facultyId } = req.params;
        const labs = await Lab.find({ instructorId: facultyId });
        res.json(labs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 3. New Function: Allow a student to join a lab using a unique code
exports.joinLabByCode = async (req, res) => {
    try {
        const { labCode, studentId } = req.body;

        // Find the lab by the code entered by the student
        const lab = await Lab.findOne({ code: labCode });
        if (!lab) {
            return res.status(404).json({ message: "Invalid Lab Code. Please check with your instructor." });
        }

        // Add the lab ID to the student's enrolledLabs array in the User model
        // $addToSet ensures they don't join the same lab twice
        await User.findByIdAndUpdate(studentId, {
            $addToSet: { enrolledLabs: lab._id }
        });

        res.json({ message: "Successfully joined the lab!", labTitle: lab.title });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 4. Get all labs (Keep for debugging or general listing)
exports.getAllLabs = async (req, res) => {
    try {
        const labs = await Lab.find();
        res.json(labs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};