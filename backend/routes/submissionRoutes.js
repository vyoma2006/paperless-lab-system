const express = require('express');
const router = express.Router();
const { 
    submitLab, 
    getSubmissions, 
    updateStatus, 
    getStudentSubmission,
    getSubmissionsByLab // <--- Add this import!
} = require('../controllers/submissionController');

router.post('/', submitLab);
router.get('/', getSubmissions);
router.patch('/:id', updateStatus);

// New filtered route
router.get('/lab/:labId', getSubmissionsByLab);

// This route must match the 3-parameter structure used in your frontend useEffect
router.get('/:labId/:studentId/:experimentId', getStudentSubmission);

module.exports = router;