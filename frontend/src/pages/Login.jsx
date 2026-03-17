import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
    const [isReg, setIsReg] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
    const { setUser } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = `http://localhost:5001/api/auth/${isReg ? 'register' : 'login'}`;
            const { data } = await axios.post(url, form);
            setUser(data);
            localStorage.setItem('userInfo', JSON.stringify(data));
        } catch (err) { 
            alert(err.response?.data?.message || "Something went wrong"); 
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '10px', textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: '#333' }}>{isReg ? 'Create Account' : 'Welcome Back'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {isReg && (
                    <input 
                        type="text" placeholder="Full Name" required
                        style={{ padding: '10px' }}
                        onChange={e => setForm({...form, name: e.target.value})} 
                    />
                )}
                <input 
                    type="email" placeholder="Email Address" required
                    style={{ padding: '10px' }}
                    onChange={e => setForm({...form, email: e.target.value})} 
                />
                <input 
                    type="password" placeholder="Password" required
                    style={{ padding: '10px' }}
                    onChange={e => setForm({...form, password: e.target.value})} 
                />
                
                {isReg && (
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ fontSize: '14px', color: '#666' }}>Register as:</label>
                        <select 
                            style={{ width: '100%', padding: '10px', marginTop: '5px' }}
                            onChange={e => setForm({...form, role: e.target.value})}
                        >
                            <option value="student">Student</option>
                            <option value="faculty">Faculty</option>
                        </select>
                    </div>
                )}

                <button type="submit" style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                    {isReg ? 'Sign Up' : 'Login'}
                </button>
            </form>
            <p onClick={() => setIsReg(!isReg)} style={{ marginTop: '20px', cursor: 'pointer', color: '#007bff', fontSize: '14px' }}>
                {isReg ? 'Already have an account? Login' : "Don't have an account? Register"}
            </p>
        </div>
    );
};

export default Login;