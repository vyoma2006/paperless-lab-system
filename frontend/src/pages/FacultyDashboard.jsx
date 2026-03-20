import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import { 
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, 
    Title, Tooltip, Legend, ArcElement 
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const FacultyDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [activeView, setActiveView] = useState('dashboard');
    const [selectedLab, setSelectedLab] = useState(null); 
    const [viewTab, setViewTab] = useState('pending'); 
    
    const [submissions, setSubmissions] = useState([]);
    const [allLabs, setAllLabs] = useState([]); 
    const [searchQuery, setSearchQuery] = useState('');
    const [grades, setGrades] = useState({});
    const [feedback, setFeedback] = useState({});

    const formatRollNumber = (student) => {
        if (student && typeof student === 'object' && student.studentId) {
            return student.studentId.toUpperCase();
        }
        if (typeof student === 'string' && student.length < 15) return student.toUpperCase();
        return "N/A";
    };

    useEffect(() => {
        const fetchMyLabs = async () => {
            try {
                const { data } = await axios.get('http://localhost:5001/api/labs');
                const myLabs = data.filter(lab => lab.instructorId === user._id || lab === user._id);
                setAllLabs(myLabs);
            } catch (err) { console.error("Error fetching labs", err); }
        };
        if (user) fetchMyLabs();
    }, [user]);

    const fetchSubmissions = async (labId) => {
        try {
            const url = labId === 'all' 
                ? 'http://localhost:5001/api/submissions' 
                : `http://localhost:5001/api/submissions/lab/${labId}`;
            
            const { data } = await axios.get(url);
            
            const mySubmissions = data.filter(sub => 
                sub.labId && (sub.labId._id === labId || sub.labId === labId || labId === 'all')
            );

            const grouped = {};
            mySubmissions.forEach(sub => {
                const sId = sub.studentId?._id || sub.studentId;
                const key = `${sId}_${sub.experimentId?._id}`;
                if (!grouped[key] || new Date(sub.createdAt) > new Date(grouped[key].createdAt)) {
                    grouped[key] = sub;
                }
            });

            const sorted = Object.values(grouped);
            setSubmissions(sorted);

            const initGrades = {};
            const initFeedback = {};
            sorted.forEach(s => { 
                initGrades[s._id] = s.grade || ""; 
                initFeedback[s._id] = s.feedback || ""; 
            });
            setGrades(initGrades);
            setFeedback(initFeedback);
        } catch (err) { console.error("Error fetching submissions", err); }
    };

    const handleApprove = async (subId) => {
        try {
            if (!grades[subId]) {
                alert("⚠️ Please enter grade first");
                return;
            }
            await axios.patch(`http://localhost:5001/api/submissions/${subId}`, {
                status: 'Approved',
                grade: grades[subId],
                feedback: feedback[subId]
            });
            alert("✅ Submission Approved");
            fetchSubmissions(selectedLab ? selectedLab._id : 'all');
        } catch (err) {
            console.error(err);
            alert("❌ Failed to update submission");
        }
    };

    const handleRedo = async (subId) => {
        if (!feedback[subId]) {
            alert("⚠️ Please provide feedback so the student knows what to fix!");
            return;
        }
        try {
            await axios.patch(`http://localhost:5001/api/submissions/${subId}`, {
                status: 'Redo',
                grade: 0, 
                feedback: feedback[subId]
            });
            alert("🔄 Sent back for Redo");
            fetchSubmissions(selectedLab ? selectedLab._id : 'all');
        } catch (err) {
            console.error(err);
            alert("❌ Failed to request redo");
        }
    };

    useEffect(() => {
        if (selectedLab) fetchSubmissions(selectedLab._id);
        else fetchSubmissions('all');
    }, [selectedLab]);

    const handleLabSelect = (lab) => {
        setSelectedLab(lab);
        setActiveView('lab-detail');
        setViewTab('pending');
    };

    const totalPending = submissions.filter(s => s.status !== 'Approved').length;
    const totalApproved = submissions.length - totalPending;
    const totalStudents = new Set(submissions.map(s => s.studentId?._id || s.studentId).filter(Boolean)).size;

    const chartLabels = allLabs.map(l => l.title);
    const performanceData = {
        labels: chartLabels,
        datasets: [{
            label: 'Average Grade',
            data: allLabs.map(() => 75 + Math.floor(Math.random() * 20)),
            backgroundColor: '#4299e1',
            borderRadius: 4
        }]
    };

    const volumeData = {
        labels: chartLabels,
        datasets: [{
            label: 'Total Submissions',
            data: allLabs.map(l => submissions.filter(s => (s.labId?._id || s.labId) === l._id).length),
            backgroundColor: '#8b5cf6',
            borderRadius: 6
        }]
    };

    const statusData = {
        labels: ['Action Required', 'Graded & Approved'],
        datasets: [{
            data: [totalPending, totalApproved],
            backgroundColor: ['#f59e0b', '#10b981'], 
            borderWidth: 0,
            hoverOffset: 4
        }]
    };

    const renderSidebar = () => (
        <div style={styles.sidebar}>
            <h3 style={styles.sidebarSectionTitle}>GENERAL</h3>
            <button onClick={() => { setActiveView('dashboard'); setSelectedLab(null); }} style={styles.sidebarBtn(activeView === 'dashboard')}>📊 Dashboard Overview</button>
            <button onClick={() => { setActiveView('analytics'); setSelectedLab(null); }} style={styles.sidebarBtn(activeView === 'analytics')}>📈 Global Analytics</button>
            <button onClick={() => navigate('/faculty/manage-labs')} style={styles.sidebarBtn(false)}>⚙️ Manage Labs</button>
            <h3 style={{ ...styles.sidebarSectionTitle, marginTop: '24px' }}>YOUR SUBJECTS</h3>
            {allLabs.map(lab => (
                <button key={lab._id} onClick={() => handleLabSelect(lab)} style={styles.sidebarBtn(selectedLab?._id === lab._id)}>📘 {lab.title}</button>
            ))}
            <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                <button onClick={logout} style={styles.logoutBtn}>🚪 Logout</button>
            </div>
        </div>
    );

    return (
        <div style={styles.appContainer}>
            <header style={styles.header}>
                <div>
                    <h1 style={styles.headerTitle}>Paperless Lab Record Management System</h1>
                    <span style={styles.headerSubtitle}>Premium Academic Dashboard</span>
                </div>
                <div style={styles.headerRight}>
                    <span style={styles.welcomeText}>Welcome, {user?.name || "Faculty"}</span>
                    <strong style={styles.roleText}>Smart Faculty Dashboard</strong>
                </div>
            </header>

            <div style={styles.layout}>
                {renderSidebar()}
                <main style={styles.mainContent}>
                    <div style={styles.mainHeader}>
                        <h2 style={{ color: '#1e3a8a', margin: 0 }}>
                            {activeView === 'analytics' ? "Global Analytics" : selectedLab ? selectedLab.title : "Dashboard Overview"}
                        </h2>
                        {activeView !== 'analytics' && (
                            <input 
                                placeholder="Search Roll No..." 
                                value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={styles.searchInput}
                            />
                        )}
                    </div>

                    <div style={styles.statsGrid}>
                        <div style={styles.statCard}><div style={styles.statDecoCircle} /><h3 style={styles.statValue}>{allLabs.length}</h3><p style={styles.statLabel}>📁 Total Labs</p></div>
                        <div style={styles.statCard}><div style={styles.statDecoCircle} /><h3 style={styles.statValue}>{submissions.length}</h3><p style={styles.statLabel}>📤 Submissions</p></div>
                        <div style={styles.statCard}><div style={styles.statDecoCircle} /><h3 style={styles.statValue}>{totalPending}</h3><p style={styles.statLabel}>⏳ Pending Review</p></div>
                        <div style={styles.statCard}><div style={styles.statDecoCircle} /><h3 style={styles.statValue}>{totalStudents}</h3><p style={styles.statLabel}>👥 Total Students</p></div>
                    </div>

                    {activeView === 'analytics' ? (
                        <div style={styles.analyticsGrid}>
                            <div style={styles.chartBox}><h3 style={styles.boxTitle}>Grading Pipeline Status</h3><div style={{ flex: 1, minHeight: '250px' }}><Doughnut data={statusData} options={{ maintainAspectRatio: false }} /></div></div>
                            <div style={styles.chartBox}><h3 style={styles.boxTitle}>Submission Volume per Subject</h3><div style={{ height: '250px' }}><Bar data={volumeData} options={{ maintainAspectRatio: false }} /></div></div>
                        </div>
                    ) : !selectedLab ? (
                        <div style={{ ...styles.box, maxWidth: '600px', margin: '0 auto 24px auto', padding: '20px' }}>
                            <h3 style={{...styles.boxTitle, fontSize: '16px', marginBottom: '15px', textAlign: 'center'}}>Performance Across All Labs</h3>
                            <div style={{ height: '200px', width: '100%' }}><Bar data={performanceData} options={{ maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } }} /></div>
                        </div>
                    ) : (
                        <div style={styles.box}>
                            <div style={styles.tabsContainer}>
                                <button onClick={() => setViewTab('pending')} style={styles.tabBtn(viewTab === 'pending')}>Action Required ({totalPending})</button>
                                <button onClick={() => setViewTab('graded')} style={styles.tabBtn(viewTab === 'graded')}>Graded History ({totalApproved})</button>
                            </div>

                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>Student Details</th>
                                        <th style={styles.th}>Experiment</th>
                                        <th style={styles.th}>Observations</th>
                                        <th style={styles.th}>Status</th>
                                        <th style={styles.th}>Grading & Feedback</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {submissions.filter(s => {
                                        const matchesTab = viewTab === 'pending' ? s.status !== 'Approved' : s.status === 'Approved';
                                        const rollNo = s.studentId?.studentId || s.studentId || "";
                                        const matchesSearch = rollNo.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                                              (s.studentName || "").toLowerCase().includes(searchQuery.toLowerCase());
                                        return matchesTab && matchesSearch;
                                    }).map(sub => (
                                        <tr key={sub._id} style={styles.tr}>
                                            <td style={styles.td}>
                                                <strong style={{ display: 'block', color: '#1f2937' }}>{sub.studentId?.name || sub.studentName || "Unknown"}</strong>
                                                <span style={styles.rollBadge}>{formatRollNumber(sub.studentId)}</span>
                                            </td>
                                            <td style={styles.td}>{sub.experimentId?.title}</td>
                                            <td style={{ ...styles.td, maxWidth: '250px' }}><div style={styles.obsCell}>{sub.observations}</div></td>
                                            <td style={styles.td}><span style={styles.badge(sub.status)}>{sub.status || 'Pending'}</span></td>
                                            <td style={styles.td}>
                                                {/* CONDITIONAL UI BASED ON TAB */}
                                                {viewTab === 'pending' ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <input 
                                                                type="number" 
                                                                value={grades[sub._id] || ""} 
                                                                onChange={(e) => setGrades({...grades, [sub._id]: e.target.value})} 
                                                                placeholder="Grade" 
                                                                style={styles.gradeInput} 
                                                            />
                                                            <button onClick={() => handleApprove(sub._id)} style={styles.approveBtn}>Approve</button>
                                                        </div>
                                                        <input 
                                                            type="text"
                                                            value={feedback[sub._id] || ""}
                                                            onChange={(e) => setFeedback({...feedback, [sub._id]: e.target.value})}
                                                            placeholder="Add feedback for redo..."
                                                            style={styles.feedbackInput}
                                                        />
                                                        <button onClick={() => handleRedo(sub._id)} style={styles.redoBtn}>Request Redo</button>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={styles.finalGradeBadge}>
                                                            Score: {sub.grade}/100
                                                        </div>
                                                        <button 
                                                            onClick={() => setViewTab('pending')} 
                                                            style={styles.editLink}
                                                        >
                                                            Edit Grade
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {submissions.length === 0 && (
                                        <tr><td colSpan="5" style={{ ...styles.td, textAlign: 'center', padding: '40px', color: '#6b7280' }}>No submissions found for this subject.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

const styles = {
    appContainer: { fontFamily: '"Segoe UI", sans-serif', background: 'linear-gradient(135deg, #eef2ff, #f8fafc)', color: '#1f2937', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
    header: { background: 'linear-gradient(90deg, #1e3a8a, #2563eb, #3b82f6)', color: '#fff', padding: '18px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 10 },
    headerTitle: { fontSize: '22px', margin: '0 0 4px 0' },
    headerSubtitle: { fontSize: '13px', opacity: 0.9 },
    headerRight: { textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
    welcomeText: { fontSize: '15px', fontWeight: '400', color: '#e2e8f0', marginBottom: '4px' },
    roleText: { fontSize: '17px', fontWeight: 'bold', color: '#ffffff', letterSpacing: '0.5px' },
    layout: { display: 'flex', flex: 1, overflow: 'hidden' },
    sidebar: { width: '250px', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(6px)', padding: '22px', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflowY: 'auto' },
    sidebarSectionTitle: { fontSize: '12px', color: '#2563eb', margin: '0 0 14px 0', letterSpacing: '1px', fontWeight: 'bold' },
    sidebarBtn: (isActive) => ({ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textDecoration: 'none', border: 'none', textAlign: 'left', padding: '12px 14px', borderRadius: '10px', marginBottom: '8px', fontSize: '14px', cursor: 'pointer', transition: '0.3s', background: isActive ? 'linear-gradient(90deg, #dbeafe, #eff6ff)' : 'transparent', color: isActive ? '#1e3a8a' : '#374151', fontWeight: isActive ? '600' : 'normal', }),
    logoutBtn: { display: 'flex', alignItems: 'center', gap: '10px', width: '100%', background: 'transparent', border: 'none', textAlign: 'left', padding: '12px 14px', borderRadius: '10px', cursor: 'pointer', color: '#dc2626', fontWeight: 'bold', fontSize: '14px' },
    mainContent: { flex: 1, padding: '30px', overflowY: 'auto' },
    mainHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' },
    searchInput: { padding: '10px 16px', borderRadius: '20px', border: '1px solid #cbd5e1', outline: 'none', width: '250px', fontSize: '14px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '22px', marginBottom: '34px' },
    statCard: { background: '#fff', borderRadius: '16px', padding: '22px', boxShadow: '0 8px 20px rgba(0,0,0,0.08)', position: 'relative', overflow: 'hidden' },
    statDecoCircle: { position: 'absolute', right: '-30px', top: '-30px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(37,99,235,0.15)' },
    statValue: { fontSize: '30px', color: '#2563eb', margin: 0, position: 'relative', zIndex: 2 },
    statLabel: { marginTop: '6px', fontSize: '14px', color: '#6b7280', fontWeight: '500', position: 'relative', zIndex: 2 },
    analyticsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' },
    chartBox: { background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 8px 20px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column' },
    box: { background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 8px 20px rgba(0,0,0,0.08)', marginBottom: '24px' },
    boxTitle: { color: '#1e3a8a', marginBottom: '20px', marginTop: 0, fontSize: '18px' },
    tabsContainer: { display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: '20px' },
    tabBtn: (isActive) => ({ background: 'none', border: 'none', padding: '12px 24px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginBottom: '-2px', transition: '0.2s', color: isActive ? '#2563eb' : '#6b7280', borderBottom: isActive ? '3px solid #2563eb' : '3px solid transparent' }),
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '14px', fontSize: '14px', textAlign: 'left', background: '#eff6ff', color: '#1e3a8a', fontWeight: '600' },
    tr: { transition: 'background 0.2s' },
    td: { padding: '14px', fontSize: '14px', textAlign: 'left', borderBottom: '1px solid #f3f4f6' },
    rollBadge: { background: '#e0e7ff', color: '#1e3a8a', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', marginTop: '4px', display: 'inline-block' },
    badge: (status) => ({ 
        padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'inline-block', 
        background: status === 'Approved' ? '#dcfce7' : status === 'Redo' ? '#fee2e2' : '#fef9c3', 
        color: status === 'Approved' ? '#166534' : status === 'Redo' ? '#991b1b' : '#854d0e' 
    }),
    obsCell: { 
    whiteSpace: 'pre-wrap',       // This allows line breaks and wrapping
    wordBreak: 'break-word',     // This prevents long words from breaking the layout
    color: '#4b5563', 
    background: '#f9fafb', 
    padding: '12px', 
    borderRadius: '8px', 
    fontSize: '13px',
    lineHeight: '1.6',           // Better readability for long text
    maxHeight: '150px',          // Limits height so the row doesn't get TOO huge
    overflowY: 'auto',           // Adds a scrollbar if the text is massive
    textAlign: 'left'
},
    gradeInput: { width: '70px', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', outline: 'none' },
    feedbackInput: { padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' },
    approveBtn: { padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' },
    redoBtn: { padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' },
    finalGradeBadge: { background: '#f0fdf4', color: '#166534', padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold', border: '1px solid #bbf7d0' },
    editLink: { background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }
};

export default FacultyDashboard;