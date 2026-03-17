const express = require('express');
const router = express.Router();
// Add getFacultyLabs to the imports here
const { createLab, getAllLabs, getFacultyLabs , joinLabByCode } = require('../controllers/labController');

router.post('/', createLab);
router.get('/', getAllLabs);

// Add this route so the dashboard can fetch labs by faculty ID
router.get('/faculty/:facultyId', getFacultyLabs);
router.post('/join', joinLabByCode);

module.exports = router;