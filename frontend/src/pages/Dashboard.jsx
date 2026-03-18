import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LabCard from '../components/LabCard';

const Dashboard = () => {
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

    return (
        <div style={containerStyle}>
            <header style={headerStyle}>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>PLRMS <span style={{ fontWeight: 300, fontSize: '14px', marginLeft: '10px', opacity: 0.8 }}>| Student Portal</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <span style={{ fontSize: '14px' }}>{user?.name} ({user?.studentId})</span>
                    <button onClick={logout} style={logoutBtnStyle}>Logout</button>
                </div>
            </header>

            <div style={layoutStyle}>
                <nav style={sidebarStyle}>
                    <div style={sectionLabel}>MENU</div>
                    <div style={view === 'dashboard' ? activeNavStyle : navItemStyle} onClick={() => setView('dashboard')}>📊 Dashboard</div>
                    <div style={view === 'labs' ? activeNavStyle : navItemStyle} onClick={() => setView('labs')}>📁 My Labs</div>
                    <div style={view === 'analytics' ? activeNavStyle : navItemStyle} onClick={() => setView('analytics')}>📈 Performance</div>
                    <div style={view === 'feedback' ? activeNavStyle : navItemStyle} onClick={() => setView('feedback')}>💬 Feedback</div>
                </nav>

                <main style={mainContentStyle}>
                    {view === 'dashboard' && (
                        <>
                            <h2 style={{ marginBottom: '25px', color: '#1e293b' }}>Overview</h2>
                            <div style={statsGrid}>
                                <div style={statCard}><h3>{enrolledLabs.length}</h3><p>Active Labs</p></div>
                                <div style={statCard}><h3>{pendingTasks}</h3><p>Pending Tasks</p></div>
                                <div style={{ ...statCard, borderLeft: '5px solid #10b981' }}><h3>{avgGrade}</h3><p>Avg Grade (%)</p></div>
                            </div>
                            <h3 style={{ color: '#1e293b', marginBottom: '15px' }}>Recently Accessed</h3>
                            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                {enrolledLabs.slice(0, 3).map(lab => (
                                    <LabCard key={lab._id} id={lab._id} labName={lab.title} labCode={lab.code} instructor={lab.instructor} />
                                ))}
                            </div>
                        </>
                    )}

                    {view === 'analytics' && (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                                <h2 style={{ color: '#1e293b', margin: 0 }}>Academic Performance</h2>
                                <input 
                                    type="text" 
                                    placeholder="Search Experiment or Lab..." 
                                    value={perfSearch}
                                    onChange={(e) => setPerfSearch(e.target.value)}
                                    style={searchInputStyle} 
                                />
                            </div>
                            <div style={cardStyle}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9', color: '#64748b' }}>
                                            <th style={{ padding: '12px' }}>Experiment</th>
                                            <th>Lab</th>
                                            <th>Grade</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPerf.length > 0 ? (
                                            filteredPerf.map(sub => (
                                                <tr key={sub._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '15px 12px', fontWeight: 600 }}>{sub.experimentId?.title || "Untitled Exp"}</td>
                                                    <td style={{ color: '#64748b' }}>{sub.labId?.title}</td>
                                                    <td style={{ color: '#2563eb', fontWeight: 'bold' }}>{sub.grade}/100</td>
                                                    <td>
                                                        <span style={{ 
                                                            background: sub.status === 'Approved' ? '#dcfce7' : '#fee2e2', 
                                                            color: sub.status === 'Approved' ? '#166534' : '#991b1b', 
                                                            padding: '4px 10px', 
                                                            borderRadius: '20px', 
                                                            fontSize: '12px',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            {sub.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                                {perfSearch ? `No results for "${perfSearch}"` : "No graded experiments found."}
                                            </td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {view === 'feedback' && (
                        <>
                            <h2 style={{ marginBottom: '25px', color: '#1e293b' }}>Faculty Feedback</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {submissions.filter(s => s.feedback).length > 0 ? (
                                    submissions.filter(s => s.feedback).map(sub => (
                                        <div key={sub._id} style={feedbackCardStyle}>
                                            <div style={feedbackHeader}>
                                                <div>
                                                    <h4 style={{ margin: 0, color: '#1e293b' }}>{sub.labId?.title}</h4>
                                                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{sub.experimentId?.title}</p>
                                                </div>
                                                <div style={gradeBadgeStyle}>{sub.grade}/100</div>
                                            </div>
                                            <div style={feedbackBody}>
                                                <p style={{ margin: 0, color: '#475569', lineHeight: '1.5' }}>"{sub.feedback}"</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={cardStyle}>
                                        <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>No feedback available yet.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {view === 'labs' && (
                        <>
                            <h2 style={{ marginBottom: '25px' }}>My Enrolled Labs</h2>
                            <div style={{ ...cardStyle, background: '#f8fafc' }}>
                                <h3 style={{ marginTop: 0, fontSize: '16px' }}>Join a New Course</h3>
                                <form onSubmit={handleJoinLab} style={{ display: 'flex', gap: '10px' }}>
                                    <input type="text" placeholder="Enter Lab Code" value={labCode} onChange={(e) => setLabCode(e.target.value)} style={inputStyle} required />
                                    <button type="submit" style={joinBtnStyle}>Join Lab</button>
                                </form>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                                {enrolledLabs.map(lab => (
                                    <LabCard key={lab._id} id={lab._id} labName={lab.title} labCode={lab.code} instructor={lab.instructor} />
                                ))}
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

// --- STYLES ---
const containerStyle = { display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' };
const headerStyle = { height: '60px', background: '#1e3a8a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 30px', zIndex: 100 };
const layoutStyle = { display: 'flex', flex: 1, overflow: 'hidden' };
const sidebarStyle = { width: '260px', background: '#0f172a', color: '#9ca3af', padding: '30px 15px', display: 'flex', flexDirection: 'column' };
const mainContentStyle = { flex: 1, padding: '40px', overflowY: 'auto', background: '#f1f5f9' };
const navItemStyle = { padding: '12px 15px', borderRadius: '8px', cursor: 'pointer', transition: '0.2s', marginBottom: '5px', fontSize: '15px' };
const activeNavStyle = { ...navItemStyle, background: '#2563eb', color: 'white', fontWeight: 'bold' };
const sectionLabel = { fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '10px', paddingLeft: '10px', letterSpacing: '1px' };
const statsGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' };
const statCard = { background: 'white', padding: '22px', borderRadius: '12px', borderLeft: '5px solid #2563eb', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const cardStyle = { background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '30px' };
const inputStyle = { flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e0', outline: 'none' };
const searchInputStyle = { padding: '10px 15px', borderRadius: '8px', border: '1px solid #cbd5e0', width: '250px', fontSize: '14px', outline: 'none' };
const joinBtnStyle = { background: '#2563eb', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const logoutBtnStyle = { background: '#ef4444', color: 'white', border: 'none', padding: '6px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' };
const feedbackCardStyle = { background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' };
const feedbackHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' };
const feedbackBody = { background: '#f8fafc', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #cbd5e0' };
const gradeBadgeStyle = { background: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' };

export default Dashboard;