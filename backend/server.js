const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const labRoutes = require('./routes/labRoutes'); // 1. Import lab routes
const submissionRoutes = require('./routes/submissionRoutes');
const experimentRoutes = require('./routes/experimentRoutes');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/labs', labRoutes); // 2. Use lab routes
app.use('/api/submissions', submissionRoutes); // 3. Use submission routes
app.use('/api/experiments', experimentRoutes); // 4. Use experiment routes

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));