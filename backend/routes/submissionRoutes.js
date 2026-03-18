const express = require("express");
const router = express.Router(); 

const { 
    submitLab, 
    getSubmissions, 
    updateStatus, 
    getStudentSubmission,
    getSubmissionsByLab,
    getStudentAllSubmissions // <--- 1. Add this to your imports
} = require('../controllers/submissionController');

router.post('/', submitLab);
router.get('/', getSubmissions);
router.patch('/:id', updateStatus);

// New filtered route
router.get('/lab/:labId', getSubmissionsByLab);

// --- 2. ADD THIS SPECIFIC ROUTE ---
// This matches the frontend call: /api/submissions/student/${user._id}
router.get('/student/:studentId', getStudentAllSubmissions);

// This route matches the 3-parameter structure for specific experiments
router.get('/:labId/:studentId/:experimentId', getStudentSubmission);

module.exports = router;