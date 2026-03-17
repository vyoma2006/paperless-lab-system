const express = require('express');
const router = express.Router();
const { 
    submitLab, 
    getSubmissions, 
    updateStatus, 
    getStudentSubmission 
} = require('../controllers/submissionController');

router.post('/', submitLab);
router.get('/', getSubmissions);
router.patch('/:id', updateStatus);

// This route must match the 3-parameter structure used in your frontend useEffect
router.get('/:labId/:studentId/:experimentId', getStudentSubmission);

module.exports = router;