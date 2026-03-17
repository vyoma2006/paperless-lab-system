const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'faculty'], default: 'student' },
    // This array stores the IDs of all labs this student joins
    enrolledLabs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lab' }] 
});

// Fixed: Changed UserSchema to userSchema to match your variable name
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model('User', userSchema);