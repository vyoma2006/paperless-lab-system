const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'faculty'], default: 'student' },
    
    // NEW: The official College Roll Number (e.g., 22CSE045)
    // 'unique' ensures no two students share an ID
    // 'sparse' allows faculty to not have a studentId without errors
    studentId: { 
        type: String, 
        unique: true, 
        sparse: true, 
        trim: true 
    },

    enrolledLabs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lab' }] 
}, { timestamps: true }); // Adding timestamps is good practice for auditing

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model('User', userSchema);