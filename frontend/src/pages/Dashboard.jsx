import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import LabCard from '../components/LabCard';

const Dashboard = () => {
    // 1. Destructure logout from AuthContext
    const { user, logout } = useContext(AuthContext); 
    const [enrolledLabs, setEnrolledLabs] = useState([]);
    const [labCode, setLabCode] = useState('');

    const fetchEnrolledLabs = async () => {
        try {
            const { data } = await axios.get(`http://localhost:5001/api/auth/me/${user._id}`);
            setEnrolledLabs(data.enrolledLabs || []);
        } catch (err) {
            console.error("Error fetching enrolled labs", err);
        }
    };

    useEffect(() => {
        if (user?._id) fetchEnrolledLabs();
    }, [user]);

    const handleJoinLab = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5001/api/labs/join', {
                labCode: labCode,
                studentId: user._id
            });
            alert('✅ Successfully joined the lab!');
            setLabCode('');
            fetchEnrolledLabs();
        } catch (err) {
            alert('❌ ' + (err.response?.data?.message || 'Failed to join lab'));
        }
    };

    return (
        <div style={{ padding: '30px', fontFamily: 'Arial', backgroundColor: '#fdfdfd', minHeight: '100vh' }}>
            
            {/* 2. HEADER SECTION WITH LOGOUT */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '30px',
                borderBottom: '2px solid #eee',
                paddingBottom: '15px'
            }}>
                <div>
                    <h1 style={{ margin: 0, color: '#333' }}>Student Dashboard</h1>
                    <p style={{ margin: 0, color: '#666' }}>Welcome, <strong>{user?.name}</strong></p>
                </div>
                <button 
                    onClick={logout} 
                    style={{ 
                        background: '#ff9800', 
                        color: 'white', 
                        border: 'none', 
                        padding: '10px 20px', 
                        borderRadius: '5px', 
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    Logout
                </button>
            </div>

            {/* JOIN LAB SECTION */}
            <section style={{ 
                background: '#f0f7ff', 
                padding: '20px', 
                borderRadius: '10px', 
                marginBottom: '30px',
                border: '1px solid #cce5ff' 
            }}>
                <h3>Join a New Lab</h3>
                <form onSubmit={handleJoinLab} style={{ display: 'flex', gap: '10px' }}>
                    <input 
                        type="text" 
                        placeholder="Enter Lab Code (e.g. CE252)" 
                        value={labCode}
                        onChange={(e) => setLabCode(e.target.value)}
                        style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', width: '250px' }}
                        required
                    />
                    <button type="submit" style={{ 
                        background: '#007bff', 
                        color: 'white', 
                        border: 'none', 
                        padding: '10px 20px', 
                        borderRadius: '5px', 
                        cursor: 'pointer' 
                    }}>
                        Join Lab
                    </button>
                </form>
            </section>

            {/* LIST OF LABS */}
            <h3>Your Enrolled Labs</h3>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {enrolledLabs.length > 0 ? (
                    enrolledLabs.map(lab => (
                        <LabCard 
                            key={lab._id} 
                            id={lab._id} 
                            labName={lab.title} 
                            labCode={lab.code} 
                            instructor={lab.instructor} 
                        />
                    ))
                ) : (
                    <p style={{ color: '#888' }}>You haven't joined any labs yet. Enter a code above to start!</p>
                )}
            </div>
        </div>
    );
};

export default Dashboard;