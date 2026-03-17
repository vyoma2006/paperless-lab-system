import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ManageLabs = () => {
    const { user, logout } = useContext(AuthContext); // Added logout from context
    const [labs, setLabs] = useState([]);
    const [labData, setLabData] = useState({ title: '', code: '' });
    const navigate = useNavigate();

    const fetchLabs = async () => {
        try {
            // Using your existing endpoint logic
            const { data } = await axios.get(`http://localhost:5001/api/labs/faculty/${user._id}`);
            setLabs(data);
        } catch (err) { console.error("Error fetching labs", err); }
    };

    useEffect(() => { 
        if (user) fetchLabs(); 
    }, [user]);

    const handleCreateLab = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5001/api/labs', { 
                ...labData, 
                instructorId: user._id, 
                instructor: user.name 
            });
            alert('✅ Lab Created!');
            setLabData({ title: '', code: '' });
            fetchLabs();
        } catch (err) { alert('❌ Error creating lab'); }
    };

    // --- SIDEBAR RENDER ---
    // --- Inside ManageLabs.jsx ---

const renderSidebar = () => (
    <div style={{ width: '280px', background: '#1a202c', color: 'white', display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div style={{ padding: '30px 20px', borderBottom: '1px solid #2d3748' }}>
            <h2 style={{ fontSize: '18px', color: '#63b3ed', margin: 0 }}>Faculty Portal</h2>
            <span style={{ fontSize: '12px', color: '#718096' }}>Prof. {user.name}</span>
        </div>

        <nav style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
            <p style={sectionLabelStyle}>General</p>
            
            {/* FIX 1: Change path to '/dashboard' to match App.js */}
            <button 
                onClick={() => navigate('/dashboard')} 
                style={sidebarBtnStyle(false)}
            >
                📊 Global Analytics
            </button>

            <button 
                onClick={() => navigate('/faculty/manage-labs')} 
                style={sidebarBtnStyle(true)} 
            >
                ⚙️ Manage Labs
            </button>

            <p style={{ ...sectionLabelStyle, marginTop: '30px' }}>Your Subjects</p>
            
            {/* FIX 2: Change path to '/dashboard/${lab._id}' to match App.js */}
            {labs.map(lab => (
                <button 
                    key={lab._id} 
                    onClick={() => navigate(`/dashboard/${lab._id}`)} 
                    style={sidebarBtnStyle(false)}
                >
                    📘 {lab.title}
                </button>
            ))}
        </nav>

        <div style={{ padding: '20px', borderTop: '1px solid #2d3748' }}>
            <button onClick={logout} style={logoutBtnStyle}>Logout</button>
        </div>
    </div>
);

    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f7fafc', fontFamily: 'Segoe UI, sans-serif' }}>
            {renderSidebar()}

            <main style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
                <div style={{ marginBottom: '30px' }}>
                    <h1 style={{ color: '#2d3748', margin: 0 }}>Manage Labs</h1>
                    <p style={{ color: '#718096' }}>Create and organize your subject lab groups</p>
                </div>

                {/* CREATE LAB SECTION */}
                <section style={{ background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '40px' }}>
                    <h3 style={{ marginTop: 0, color: '#2d3748' }}>Create New Lab Group</h3>
                    <form onSubmit={handleCreateLab} style={{ display: 'flex', gap: '15px' }}>
                        <input 
                            placeholder="Lab Title (e.g. Physics I)" 
                            value={labData.title} 
                            onChange={e => setLabData({...labData, title: e.target.value})} 
                            required 
                            style={inputStyle} 
                        />
                        <input 
                            placeholder="Code (e.g. PHY101)" 
                            value={labData.code} 
                            onChange={e => setLabData({...labData, code: e.target.value})} 
                            required 
                            style={inputStyle} 
                        />
                        <button type="submit" style={addBtnStyle}>Add Lab</button>
                    </form>
                </section>

                {/* LIST OF LABS */}
                <h3 style={{ color: '#2d3748', marginBottom: '20px' }}>Existing Labs</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' }}>
                    {labs.map(lab => (
                        <div key={lab._id} style={labCardStyle}>
                            <div style={{ marginBottom: '20px' }}>
                                <h4 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#2d3748' }}>{lab.title}</h4>
                                <span style={codeBadgeStyle}>{lab.code}</span>
                            </div>
                            <button 
                                onClick={() => navigate(`/faculty/manage-manuals/${lab._id}`)}
                                style={manageBtnStyle}
                            >
                                Manage Experiments →
                            </button>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

// --- STYLES ---
const sidebarBtnStyle = (isActive) => ({
    width: '100%', padding: '12px 15px', textAlign: 'left', borderRadius: '8px', border: 'none', cursor: 'pointer', marginBottom: '5px',
    background: isActive ? '#2b6cb0' : 'transparent', color: isActive ? 'white' : '#a0aec0', fontSize: '15px', fontWeight: isActive ? 'bold' : 'normal', transition: '0.2s'
});

const sectionLabelStyle = { fontSize: '11px', color: '#4a5568', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', marginBottom: '10px', paddingLeft: '10px' };

const logoutBtnStyle = { width: '100%', padding: '12px', background: '#e53e3e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };

const inputStyle = { flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px' };

const addBtnStyle = { background: '#38a169', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };

const labCardStyle = { background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' };

const codeBadgeStyle = { background: '#ebf8ff', color: '#2c5282', padding: '3px 10px', borderRadius: '5px', fontSize: '12px', fontWeight: 'bold' };

const manageBtnStyle = { width: '100%', background: '#3182ce', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };

export default ManageLabs;