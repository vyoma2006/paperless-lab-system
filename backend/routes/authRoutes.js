const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');
const User = require('../models/User'); // Import User model

router.post('/register', registerUser);
router.post('/login', loginUser);

// NEW ROUTE: Fetch user details and populate their labs
router.get('/me/:id', async (req, res) => {
    try {
        // .populate('enrolledLabs') converts the IDs into full Lab objects
        const user = await User.findById(req.params.id).populate('enrolledLabs');
        if (!user) return res.status(404).json({ message: "User not found" });
        
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;