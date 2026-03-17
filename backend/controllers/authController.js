const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.registerUser = async (req, res) => {
    try {
        // 1. Destructure studentId from the request body
        const { name, email, password, role, studentId } = req.body;

        // 2. Create the user including studentId (it will be null for faculty)
        const user = await User.create({ name, email, password, role, studentId });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

        // 3. Return studentId in the response so the frontend can store it
        res.status(201).json({ 
            _id: user._id, 
            name: user.name, 
            role: user.role, 
            studentId: user.studentId, 
            token 
        });
    } catch (err) {
        // Mongoose will throw an error here if studentId is not unique
        res.status(400).json({ message: err.message });
    }
};

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
            
            // 4. Return studentId during login as well
            res.json({ 
                _id: user._id, 
                name: user.name, 
                role: user.role, 
                studentId: user.studentId, 
                token 
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};