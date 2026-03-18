const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const labRoutes = require('./routes/labRoutes'); 
const submissionRoutes = require('./routes/submissionRoutes');
const experimentRoutes = require('./routes/experimentRoutes');

// Initialize dotenv so we can read the .env file
dotenv.config({ path: "./.env" });

// Connect to the database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/labs', labRoutes); 
app.use('/api/submissions', submissionRoutes); 
app.use('/api/experiments', experimentRoutes); 

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));

