import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LabCard from '../components/LabCard';

const Dashboard = () => {
    // ---------------------------------------------------------
    // CORE LOGIC (UNCHANGED)
    // ---------------------------------------------------------
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [view, setView] = useState('dashboard');
    const [enrolledLabs, setEnrolledLabs] = useState([]);
    const [submissions, setSubmissions] = useState([]); 
    const [labCode, setLabCode] = useState('');
    
    // NEW: Search state for Analytics/Performance
    const [perfSearch, setPerfSearch] = useState('');

    const fetchData = async () => {
        try {
            const userRes = await axios.get(`http://localhost:5001/api/auth/me/${user._id}`);
            setEnrolledLabs(userRes.data.enrolledLabs || []);

            const subRes = await axios.get(`http://localhost:5001/api/submissions/student/${user._id}`);
            setSubmissions(subRes.data || []);
        } catch (err) {
            console.error("Error fetching dashboard data", err);
        }
    };

    useEffect(() => {
        if (user?._id) fetchData();
    }, [user]);

    // Reset search when switching views
    useEffect(() => {
        setPerfSearch('');
    }, [view]);

    // --- ANALYTICS CALCULATIONS ---
    const gradedSubmissions = submissions.filter(s => s.status === 'Approved' || s.grade > 0);
    
    const avgGrade = gradedSubmissions.length > 0 
        ? (gradedSubmissions.reduce((acc, curr) => acc + curr.grade, 0) / gradedSubmissions.length).toFixed(1) 
        : '--';
        
    const pendingTasks = submissions.filter(s => s.status === 'Pending' || s.status === 'Redo').length;

    // Filtered submissions for the Analytics table
    const filteredPerf = gradedSubmissions.filter(sub => 
        sub.experimentId?.title?.toLowerCase().includes(perfSearch.toLowerCase()) ||
        sub.labId?.title?.toLowerCase().includes(perfSearch.toLowerCase())
    );

    const handleJoinLab = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5001/api/labs/join', { labCode, studentId: user._id });
            alert('✅ Successfully joined!');
            setLabCode('');
            fetchData();
            setView('labs');
        } catch (err) { alert('❌ ' + (err.response?.data?.message || 'Failed')); }
    };

    // ---------------------------------------------------------
    // PREMIUM UI RENDER
    // ---------------------------------------------------------
    return (
        <div style={styles.appContainer}>
            {/* Header */}
            <header style={styles.header}>
                <div>
                    <h1 style={styles.headerTitle}>Paperless Lab Record Management System</h1>
                    <span style={styles.headerSubtitle}>Student Workspace</span>
                </div>
                {/* Top Right Welcome Section */}
                <div style={styles.headerRight}>
                    <span style={styles.welcomeText}>Welcome, {user?.name || "Student"}</span>
                    <strong style={styles.roleText}>Smart Student Dashboard</strong>
                </div>
            </header>

            {/* Layout */}
            <div style={styles.layout}>
                
                {/* Sidebar */}
                <div style={styles.sidebar}>
                    <h3 style={styles.sidebarSectionTitle}>GENERAL</h3>
                    
                    <button onClick={() => setView('dashboard')} style={styles.sidebarBtn(view === 'dashboard')}>
                        📊 Dashboard Overview
                    </button>
                    <button onClick={() => setView('labs')} style={styles.sidebarBtn(view === 'labs')}>
                        📁 My Enrolled Labs
                    </button>
                    <button onClick={() => setView('analytics')} style={styles.sidebarBtn(view === 'analytics')}>
                        📈 Academic Performance
                    </button>
                    <button onClick={() => setView('feedback')} style={styles.sidebarBtn(view === 'feedback')}>
                        💬 Faculty Feedback
                    </button>
                    
                    <div style={styles.sidebarFooter}>
                        <button onClick={logout} style={styles.logoutBtn}>
                            🚪 Logout
                        </button>
                    </div>
                </div>

                {/* Main Content Routing */}
                <main style={styles.mainContent}>
                    
                    {/* VIEW: DASHBOARD */}
                    {view === 'dashboard' && (
                        <>
                            <h2 style={styles.pageTitle}>Dashboard Overview</h2>
                            
                            <div style={styles.statsGrid}>
                                <div style={styles.statCard}>
                                    <div style={styles.statDecoCircle} />
                                    <h3 style={styles.statValue}>{enrolledLabs.length}</h3>
                                    <p style={styles.statLabel}>📁 Active Labs</p>
                                </div>
                                <div style={styles.statCard}>
                                    <div style={styles.statDecoCircle} />
                                    <h3 style={styles.statValue}>{pendingTasks}</h3>
                                    <p style={styles.statLabel}>⏳ Pending Tasks</p>
                                </div>
                                <div style={styles.statCard}>
                                    <div style={{...styles.statDecoCircle, background: 'rgba(16, 185, 129, 0.15)'}} />
                                    <h3 style={{...styles.statValue, color: '#10b981'}}>{avgGrade}</h3>
                                    <p style={styles.statLabel}>🎓 Avg Grade (%)</p>
                                </div>
                            </div>
                            
                            <div style={styles.box}>
                                <h3 style={styles.boxTitle}>Recently Accessed Labs</h3>
                                {enrolledLabs.length > 0 ? (
                                    <div style={styles.labCardsContainer}>
                                        {enrolledLabs.slice(0, 3).map(lab => (
                                            <LabCard key={lab._id} id={lab._id} labName={lab.title} labCode={lab.code} instructor={lab.instructor} />
                                        ))}
                                    </div>
                                ) : (
                                    <div style={styles.emptyState}>You haven't joined any labs yet. Check the "My Enrolled Labs" tab to join one.</div>
                                )}
                            </div>
                        </>
                    )}

                    {/* VIEW: ANALYTICS / PERFORMANCE */}
                    {view === 'analytics' && (
                        <>
                            <div style={styles.mainHeader}>
                                <h2 style={styles.pageTitle}>Academic Performance</h2>
                                <input 
                                    type="text" 
                                    placeholder="Search Experiment or Lab..." 
                                    value={perfSearch}
                                    onChange={(e) => setPerfSearch(e.target.value)}
                                    style={styles.searchInput} 
                                />
                            </div>
                            <div style={styles.box}>
                                <table style={styles.table}>
                                    <thead>
                                        <tr>
                                            <th style={styles.th}>Experiment</th>
                                            <th style={styles.th}>Lab</th>
                                            <th style={styles.th}>Grade</th>
                                            <th style={styles.th}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPerf.length > 0 ? (
                                            filteredPerf.map(sub => (
                                                <tr key={sub._id} style={styles.tr}>
                                                    <td style={{ ...styles.td, fontWeight: '600', color: '#1f2937' }}>
                                                        {sub.experimentId?.title || "Untitled Exp"}
                                                    </td>
                                                    <td style={styles.td}>{sub.labId?.title}</td>
                                                    <td style={{ ...styles.td, color: '#2563eb', fontWeight: 'bold' }}>
                                                        {sub.grade}/100
                                                    </td>
                                                    <td style={styles.td}>
                                                        <span style={styles.badge(sub.status === 'Approved')}>
                                                            {sub.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" style={{ ...styles.td, textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                                                    {perfSearch ? `No results found for "${perfSearch}"` : "No graded experiments found."}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {/* VIEW: FEEDBACK */}
                    {view === 'feedback' && (
                        <>
                            <h2 style={styles.pageTitle}>Faculty Feedback</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {submissions.filter(s => s.feedback).length > 0 ? (
                                    submissions.filter(s => s.feedback).map(sub => (
                                        <div key={sub._id} style={styles.feedbackCard}>
                                            <div style={styles.feedbackHeader}>
                                                <div>
                                                    <h4 style={styles.feedbackLabTitle}>{sub.labId?.title}</h4>
                                                    <p style={styles.feedbackExpTitle}>{sub.experimentId?.title}</p>
                                                </div>
                                                <div style={styles.gradeBadgeStyle}>{sub.grade}/100</div>
                                            </div>
                                            <div style={styles.feedbackBody}>
                                                <p style={styles.feedbackText}>"{sub.feedback}"</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={styles.emptyState}>No instructor feedback available yet.</div>
                                )}
                            </div>
                        </>
                    )}

                    {/* VIEW: LABS */}
                    {view === 'labs' && (
                        <>
                            <h2 style={styles.pageTitle}>My Enrolled Labs</h2>
                            
                            <div style={{ ...styles.box, background: '#f8fafc', border: '1px dashed #cbd5e1', marginBottom: '30px' }}>
                                <h3 style={styles.boxTitle}>Join a New Course</h3>
                                <form onSubmit={handleJoinLab} style={styles.joinForm}>
                                    <input 
                                        type="text" 
                                        placeholder="Enter Lab Code provided by your instructor" 
                                        value={labCode} 
                                        onChange={(e) => setLabCode(e.target.value)} 
                                        style={styles.joinInput} 
                                        required 
                                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                        onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                                    />
                                    <button type="submit" style={styles.submitBtn}>+ Join Lab</button>
                                </form>
                            </div>
                            
                            <div style={styles.labCardsContainer}>
                                {enrolledLabs.length > 0 ? (
                                    enrolledLabs.map(lab => (
                                        <LabCard key={lab._id} id={lab._id} labName={lab.title} labCode={lab.code} instructor={lab.instructor} />
                                    ))
                                ) : (
                                    <div style={{...styles.emptyState, width: '100%'}}>You are not enrolled in any labs. Use the form above to join one.</div>
                                )}
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

// --- SINGLE-FILE CSS-IN-JS STYLES ---
const styles = {
    appContainer: { fontFamily: '"Segoe UI", sans-serif', background: 'linear-gradient(135deg, #eef2ff, #f8fafc)', color: '#1f2937', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
    
    // Header
    header: { background: 'linear-gradient(90deg, #1e3a8a, #2563eb, #3b82f6)', color: '#fff', padding: '18px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 10 },
    headerTitle: { fontSize: '22px', margin: '0 0 4px 0' },
    headerSubtitle: { fontSize: '13px', opacity: 0.9 },
    headerRight: { textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
    welcomeText: { fontSize: '15px', fontWeight: '400', color: '#e2e8f0', marginBottom: '4px' },
    roleText: { fontSize: '17px', fontWeight: 'bold', color: '#ffffff', letterSpacing: '0.5px' },

    layout: { display: 'flex', flex: 1, overflow: 'hidden' },

    // Sidebar
    sidebar: { width: '250px', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(6px)', padding: '22px', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflowY: 'auto' },
    sidebarSectionTitle: { fontSize: '13px', color: '#2563eb', margin: '0 0 14px 0', fontWeight: 'bold', letterSpacing: '1px' },
    sidebarBtn: (isActive) => ({
        display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textDecoration: 'none', border: 'none', textAlign: 'left',
        padding: '12px 14px', borderRadius: '10px', marginBottom: '8px', fontSize: '15px', cursor: 'pointer', transition: '0.3s',
        background: isActive ? 'linear-gradient(90deg, #dbeafe, #eff6ff)' : 'transparent', color: isActive ? '#1e3a8a' : '#374151', fontWeight: isActive ? '600' : 'normal',
    }),
    sidebarFooter: { marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #e5e7eb' },
    logoutBtn: { display: 'flex', alignItems: 'center', gap: '10px', width: '100%', background: 'transparent', border: 'none', textAlign: 'left', padding: '12px 14px', borderRadius: '10px', cursor: 'pointer', color: '#dc2626', fontWeight: 'bold', fontSize: '15px' },

    // Main Content
    mainContent: { flex: 1, padding: '40px', overflowY: 'auto' },
    mainHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
    pageTitle: { color: '#1e3a8a', fontSize: '26px', margin: '0 0 25px 0' },
    searchInput: { padding: '10px 16px', borderRadius: '20px', border: '1px solid #cbd5e1', outline: 'none', width: '250px', fontSize: '14px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' },

    // Stats Grid
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '22px', marginBottom: '34px' },
    statCard: { background: '#fff', borderRadius: '16px', padding: '22px', boxShadow: '0 8px 20px rgba(0,0,0,0.08)', position: 'relative', overflow: 'hidden' },
    statDecoCircle: { position: 'absolute', right: '-30px', top: '-30px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(37,99,235,0.15)' },
    statValue: { fontSize: '30px', color: '#2563eb', margin: 0, position: 'relative', zIndex: 2 },
    statLabel: { marginTop: '6px', fontSize: '14px', color: '#6b7280', fontWeight: '500', position: 'relative', zIndex: 2 },

    // Box Component
    box: { background: '#fff', borderRadius: '16px', padding: '30px', boxShadow: '0 8px 20px rgba(0,0,0,0.08)', marginBottom: '24px' },
    boxTitle: { color: '#1e3a8a', margin: '0 0 20px 0', fontSize: '18px' },

    // Labs & Join Form
    labCardsContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
    joinForm: { display: 'flex', gap: '15px' },
    joinInput: { flex: 1, padding: '14px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', transition: '0.2s', background: '#fff' },
    submitBtn: { background: '#10b981', color: 'white', border: 'none', padding: '12px 28px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', fontSize: '15px', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)' },
    emptyState: { padding: '40px', textAlign: 'center', color: '#6b7280', border: '1px dashed #cbd5e1', borderRadius: '12px', background: '#f8fafc', fontSize: '15px' },
    
    // Table
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '14px', fontSize: '14px', textAlign: 'left', background: '#eff6ff', color: '#1e3a8a', fontWeight: '600' },
    tr: { transition: 'background 0.2s', borderBottom: '1px solid #f3f4f6' },
    td: { padding: '14px', fontSize: '14px', textAlign: 'left' },
    badge: (isApproved) => ({ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'inline-block', background: isApproved ? '#dcfce7' : '#fee2e2', color: isApproved ? '#166534' : '#991b1b' }),

    // Feedback Cards
    feedbackCard: { background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 8px 20px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' },
    feedbackHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' },
    feedbackLabTitle: { margin: '0 0 6px 0', color: '#1f2937', fontSize: '18px' },
    feedbackExpTitle: { margin: 0, fontSize: '14px', color: '#64748b' },
    gradeBadgeStyle: { background: '#eff6ff', color: '#2563eb', padding: '6px 14px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' },
    feedbackBody: { background: '#f8fafc', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #cbd5e1' },
    feedbackText: { margin: 0, color: '#475569', lineHeight: '1.6', fontSize: '15px', fontStyle: 'italic' }
};

export default Dashboard;