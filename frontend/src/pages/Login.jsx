import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    // ---------------------------------------------------------
    // CORE LOGIC (UNCHANGED)
    // ---------------------------------------------------------
    const [isReg, setIsReg] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', studentId: '' });
    const { setUser } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = `http://localhost:5001/api/auth/${isReg ? 'register' : 'login'}`;
            
            // For login, we don't need to send name or studentId
            const payload = isReg ? form : { email: form.email, password: form.password };
            
            const { data } = await axios.post(url, payload);
            setUser(data);
            localStorage.setItem('userInfo', JSON.stringify(data));
        } catch (err) { 
            alert(err.response?.data?.message || "Something went wrong"); 
        }
    };

    // ---------------------------------------------------------
    // PREMIUM UI RENDER
    // ---------------------------------------------------------
    return (
        <div style={styles.pageContainer}>
            <div style={styles.authCard}>
                
                {/* Branding & Header */}
                <div style={styles.headerContainer}>
                    <h1 style={styles.brandTitle}>PLRMS</h1>
                    <h2 style={styles.pageTitle}>{isReg ? 'Create an Account' : 'Welcome Back'}</h2>
                    <p style={styles.pageSubtitle}>
                        {isReg ? 'Sign up to access the Paperless Lab System' : 'Enter your credentials to access your dashboard'}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={styles.form}>
                    {isReg && (
                        <input 
                            type="text" 
                            placeholder="Full Name" 
                            required
                            style={styles.input}
                            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                            onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                            onChange={e => setForm({...form, name: e.target.value})} 
                        />
                    )}
                    
                    <input 
                        type="email" 
                        placeholder="Email Address" 
                        required
                        style={styles.input}
                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                        onChange={e => setForm({...form, email: e.target.value})} 
                    />

                    {/* Student ID Field */}
                    {isReg && form.role === 'student' && (
                        <input 
                            type="text" 
                            placeholder="College Roll Number (e.g. 22CSE045)" 
                            required
                            style={styles.input}
                            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                            onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                            value={form.studentId}
                            onChange={e => setForm({...form, studentId: e.target.value.toUpperCase()})} 
                        />
                    )}

                    <input 
                        type="password" 
                        placeholder="Password" 
                        required
                        style={styles.input}
                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                        onChange={e => setForm({...form, password: e.target.value})} 
                    />
                    
                    {isReg && (
                        <div style={styles.roleContainer}>
                            <label style={styles.roleLabel}>I am registering as a:</label>
                            <select 
                                style={styles.select}
                                value={form.role}
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                                onChange={e => setForm({...form, role: e.target.value, studentId: e.target.value === 'faculty' ? '' : form.studentId})}
                            >
                                <option value="student">Student</option>
                                <option value="faculty">Faculty Instructor</option>
                            </select>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        style={styles.submitBtn}
                        onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'}
                        onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                        {isReg ? 'Sign Up' : 'Login to Dashboard'}
                    </button>
                </form>

                {/* Toggle Mode */}
                <div style={styles.toggleContainer}>
                    <p 
                        onClick={() => { setIsReg(!isReg); setForm({...form, role: 'student'}); }} 
                        style={styles.toggleText}
                    >
                        {isReg ? 'Already have an account? Log in here' : "Don't have an account? Register"}
                    </p>
                </div>

            </div>
        </div>
    );
};

// --- SINGLE-FILE CSS-IN-JS STYLES ---
const styles = {
    pageContainer: {
        fontFamily: '"Segoe UI", sans-serif',
        background: 'linear-gradient(135deg, #eef2ff, #f8fafc)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
    },
    authCard: {
        background: '#ffffff',
        width: '100%',
        maxWidth: '420px',
        padding: '40px',
        borderRadius: '20px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
        boxSizing: 'border-box'
    },
    headerContainer: {
        textAlign: 'center',
        marginBottom: '30px'
    },
    brandTitle: {
        color: '#2563eb',
        fontSize: '16px',
        fontWeight: 'bold',
        letterSpacing: '2px',
        margin: '0 0 10px 0'
    },
    pageTitle: {
        color: '#1e3a8a',
        fontSize: '26px',
        margin: '0 0 8px 0',
        fontWeight: 'bold'
    },
    pageSubtitle: {
        color: '#6b7280',
        fontSize: '14px',
        margin: 0,
        lineHeight: '1.5'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
    },
    input: {
        width: '100%',
        padding: '14px 16px',
        borderRadius: '10px',
        border: '1px solid #cbd5e1',
        background: '#f8fafc',
        fontSize: '15px',
        outline: 'none',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box',
        color: '#1f2937'
    },
    roleContainer: {
        textAlign: 'left',
        marginTop: '4px'
    },
    roleLabel: {
        fontSize: '13px',
        color: '#4b5563',
        fontWeight: '600',
        marginBottom: '6px',
        display: 'block'
    },
    select: {
        width: '100%',
        padding: '14px 16px',
        borderRadius: '10px',
        border: '1px solid #cbd5e1',
        background: '#f8fafc',
        fontSize: '15px',
        outline: 'none',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box',
        color: '#1f2937',
        cursor: 'pointer',
        appearance: 'none', // removes default OS dropdown arrow for a cleaner look
    },
    submitBtn: {
        width: '100%',
        padding: '14px',
        marginTop: '10px',
        background: 'linear-gradient(90deg, #1e3a8a, #2563eb)',
        color: '#ffffff',
        border: 'none',
        borderRadius: '10px',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
    },
    toggleContainer: {
        marginTop: '24px',
        textAlign: 'center',
        borderTop: '1px solid #f1f5f9',
        paddingTop: '20px'
    },
    toggleText: {
        color: '#2563eb',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        margin: 0,
        transition: 'color 0.2s ease'
    }
};

export default Login;