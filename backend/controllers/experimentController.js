const Experiment = require('../models/Experiment');

// 1. Function to save a new experiment manual
exports.addExperiment = async (req, res) => {
    try {
        const { labId, title, aim, procedure, resources } = req.body;
        const experiment = await Experiment.create({ 
            labId, 
            title, 
            aim, 
            procedure, 
            resources 
        });
        res.status(201).json(experiment);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// 2. Function to get all experiments for a specific lab
exports.getLabExperiments = async (req, res) => {
    try {
        const { labId } = req.params;
        const experiments = await Experiment.find({ labId: labId });
        res.json(experiments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};