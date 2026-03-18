import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ManageLabs = () => {
    // ---------------------------------------------------------
    // CORE LOGIC (UNCHANGED)
    // ---------------------------------------------------------
    const { user, logout } = useContext(AuthContext); 
    const [labs, setLabs] = useState([]);
    const [labData, setLabData] = useState({ title: '', code: '' });
    const navigate = useNavigate();

    const fetchLabs = async () => {
        try {
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

    // --- SIDEBAR COMPONENT ---
    const renderSidebar = () => (
        <div style={styles.sidebar}>
            <h3 style={styles.sidebarSectionTitle}>NAVIGATION</h3>
            
            <button 
                onClick={() => navigate('/dashboard')} 
                style={styles.sidebarBtn(false)}
            >
                📊 Global Analytics
            </button>

            <button 
                onClick={() => navigate('/faculty/manage-labs')} 
                style={styles.sidebarBtn(true)} 
            >
                ⚙️ Manage Labs
            </button>

            <h3 style={{ ...styles.sidebarSectionTitle, marginTop: '24px' }}>YOUR SUBJECTS</h3>
            {labs.map(lab => (
                <button 
                    key={lab._id} 
                    onClick={() => navigate(`/dashboard/${lab._id}`)} 
                    style={styles.sidebarBtn(false)}
                >
                    📘 {lab.title}
                </button>
            ))}

            <div style={styles.sidebarFooter}>
                <button onClick={logout} style={styles.logoutBtn}>
                    🚪 Logout
                </button>
            </div>
        </div>
    );

    // ---------------------------------------------------------
    // PREMIUM UI RENDER
    // ---------------------------------------------------------
    return (
        <div style={styles.appContainer}>
            {/* Top Header */}
            <header style={styles.header}>
                <div>
                    <h1 style={styles.headerTitle}>Paperless Lab Record Management System</h1>
                    <span style={styles.headerSubtitle}>Faculty Portal - Lab Management</span>
                </div>
            </header>

            {/* Layout */}
            <div style={styles.layout}>
                {renderSidebar()}

                <main style={styles.mainContent}>
                    
                    {/* Page Header */}
                    <div style={styles.pageHeader}>
                        <h2 style={styles.pageTitle}>Manage Labs</h2>
                        <p style={styles.pageSubtitle}>Create and organize your subject lab groups.</p>
                    </div>

                    {/* CREATE LAB SECTION */}
                    <section style={styles.box}>
                        <h3 style={styles.boxTitle}>Create New Lab Group</h3>
                        <form onSubmit={handleCreateLab} style={styles.formRow}>
                            <input 
                                placeholder="Lab Title (e.g. Physics I)" 
                                value={labData.title} 
                                onChange={e => setLabData({...labData, title: e.target.value})} 
                                required 
                                style={styles.input}
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                            />
                            <input 
                                placeholder="Code (e.g. PHY101)" 
                                value={labData.code} 
                                onChange={e => setLabData({...labData, code: e.target.value})} 
                                required 
                                style={styles.input}
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                            />
                            <button 
                                type="submit" 
                                style={styles.addBtn}
                                onMouseOver={(e) => e.target.style.background = '#059669'}
                                onMouseOut={(e) => e.target.style.background = '#10b981'}
                            >
                                + Add Lab
                            </button>
                        </form>
                    </section>

                    {/* LIST OF LABS */}
                    <div style={styles.sectionHeader}>
                        <h3 style={styles.sectionTitle}>Existing Labs ({labs.length})</h3>
                    </div>
                    
                    {labs.length === 0 ? (
                        <div style={styles.emptyState}>
                            You haven't created any labs yet. Create one above to get started.
                        </div>
                    ) : (
                        <div style={styles.grid}>
                            {labs.map(lab => (
                                <div key={lab._id} style={styles.card}>
                                    <div style={{ marginBottom: '20px' }}>
                                        <h4 style={styles.cardTitle}>{lab.title}</h4>
                                        <span style={styles.codeBadge}>{lab.code}</span>
                                    </div>
                                    <button 
                                        onClick={() => navigate(`/faculty/manage-manuals/${lab._id}`)}
                                        style={styles.manageBtn}
                                        onMouseOver={(e) => e.target.style.background = '#2563eb'}
                                        onMouseOut={(e) => e.target.style.background = '#3b82f6'}
                                    >
                                        Manage Experiments →
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
};

// --- SINGLE-FILE CSS-IN-JS STYLES ---
const styles = {
    appContainer: {
        fontFamily: '"Segoe UI", sans-serif',
        background: 'linear-gradient(135deg, #eef2ff, #f8fafc)',
        color: '#1f2937',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
    },
    header: {
        background: 'linear-gradient(90deg, #1e3a8a, #2563eb, #3b82f6)',
        color: '#fff',
        padding: '18px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 10
    },
    headerTitle: { fontSize: '22px', margin: '0 0 4px 0' },
    headerSubtitle: { fontSize: '13px', opacity: 0.9 },
    layout: { display: 'flex', flex: 1, overflow: 'hidden' },

    // Sidebar
    sidebar: {
        width: '260px',
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(6px)',
        padding: '24px',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto'
    },
    sidebarSectionTitle: { fontSize: '13px', color: '#2563eb', margin: '0 0 14px 0', letterSpacing: '1px', fontWeight: 'bold' },
    sidebarBtn: (isActive) => ({
        display: 'block', width: '100%', textAlign: 'left', padding: '12px 14px',
        borderRadius: '10px', border: 'none', fontSize: '14px', cursor: 'pointer', transition: '0.2s', marginBottom: '8px',
        background: isActive ? 'linear-gradient(90deg, #dbeafe, #eff6ff)' : 'transparent',
        color: isActive ? '#1e3a8a' : '#374151',
        fontWeight: isActive ? '600' : 'normal',
    }),
    sidebarFooter: { marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #e5e7eb' },
    logoutBtn: {
        display: 'block', width: '100%', textAlign: 'left', padding: '12px 14px',
        background: 'transparent', border: 'none', borderRadius: '10px', cursor: 'pointer',
        color: '#dc2626', fontWeight: 'bold', fontSize: '14px'
    },

    // Main Content
    mainContent: { flex: 1, padding: '40px', overflowY: 'auto' },
    pageHeader: { marginBottom: '30px' },
    pageTitle: { color: '#1e3a8a', fontSize: '28px', margin: '0 0 8px 0' },
    pageSubtitle: { color: '#6b7280', fontSize: '15px', margin: 0 },

    // Create Box
    box: { background: '#fff', borderRadius: '16px', padding: '30px', boxShadow: '0 8px 20px rgba(0,0,0,0.06)', marginBottom: '40px' },
    boxTitle: { color: '#1f2937', margin: '0 0 20px 0', fontSize: '18px' },
    formRow: { display: 'flex', gap: '16px', flexWrap: 'wrap' },
    input: {
        flex: 1, minWidth: '200px', padding: '14px 16px', borderRadius: '10px',
        border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', transition: 'all 0.2s ease', background: '#f8fafc'
    },
    addBtn: {
        background: '#10b981', color: 'white', border: 'none', padding: '14px 28px',
        borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px',
        transition: '0.2s', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)'
    },

    // Grid Area
    sectionHeader: { marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' },
    sectionTitle: { color: '#1e3a8a', fontSize: '20px', margin: 0 },
    emptyState: { textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '16px', color: '#6b7280', border: '1px dashed #cbd5e1' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' },
    
    // Cards
    card: {
        background: '#fff', padding: '24px', borderRadius: '16px',
        boxShadow: '0 8px 20px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        border: '1px solid #f1f5f9', transition: 'transform 0.2s',
    },
    cardTitle: { margin: '0 0 10px 0', fontSize: '20px', color: '#1f2937' },
    codeBadge: { background: '#e0e7ff', color: '#1e3a8a', padding: '4px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' },
    manageBtn: {
        width: '100%', background: '#3b82f6', color: 'white', border: 'none',
        padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', transition: '0.2s'
    }
};

export default ManageLabs;