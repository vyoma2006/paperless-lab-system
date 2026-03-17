const express = require('express');
const router = express.Router();
const { addExperiment, getLabExperiments } = require('../controllers/experimentController');

// Route to save a new experiment manual
router.post('/', addExperiment);

// Route to get all experiments belonging to a specific Lab ID
router.get('/:labId', getLabExperiments);

module.exports = router; 