import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import { 
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, 
    Title, Tooltip, Legend, ArcElement 
} from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const FacultyDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    
    // UI State
    const [activeView, setActiveView] = useState('dashboard'); // 'dashboard', 'analytics', or 'lab-detail'
    const [selectedLab, setSelectedLab] = useState(null); 
    const [viewTab, setViewTab] = useState('pending'); 
    
    // Data State
    const [submissions, setSubmissions] = useState([]);
    const [allLabs, setAllLabs] = useState([]); 
    const [searchQuery, setSearchQuery] = useState('');
    const [grades, setGrades] = useState({});
    const [feedback, setFeedback] = useState({});

    const formatRollNumber = (id) => {
        if (!id || id.length > 15) return id?.substring(id.length - 5).toUpperCase() || "N/A";
        return id.toUpperCase();
    };

    // 1. Fetch all labs managed by this instructor
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

    // 2. Fetch submissions for the selected lab
    const fetchSubmissions = async (labId) => {
        try {
            const url = labId === 'all' 
                ? 'http://localhost:5001/api/submissions' 
                : `http://localhost:5001/api/submissions/lab/${labId}`;
            
            const { data } = await axios.get(url);
            
            const mySubmissions = data.filter(sub => 
                sub.labId && (sub.labId.instructorId === user._id || sub.labId === user._id)
            );

            const grouped = {};
            mySubmissions.forEach(sub => {
                const key = `${sub.studentId}_${sub.experimentId?._id}`;
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

    useEffect(() => {
        if (selectedLab) fetchSubmissions(selectedLab._id);
        else fetchSubmissions('all');
    }, [selectedLab]);

    const handleLabSelect = (lab) => {
        setSelectedLab(lab);
        setActiveView('lab-detail');
        setViewTab('pending');
    };

    // Helper metrics
    const totalPending = submissions.filter(s => s.status !== 'Approved').length;
    const totalApproved = submissions.length - totalPending;
    const totalStudents = new Set(submissions.map(s => s.studentId).filter(Boolean)).size;

    // --- CHART DATA PREPARATION ---
    const chartLabels = allLabs.map(l => l.title);
    
    // Chart 1: Small chart for the main dashboard
    const performanceData = {
        labels: chartLabels,
        datasets: [{
            label: 'Average Grade',
            data: allLabs.map(() => 75 + Math.floor(Math.random() * 20)), // Demo data
            backgroundColor: '#4299e1',
            borderRadius: 4
        }]
    };

    // Chart 2: For Analytics Page
    const volumeData = {
        labels: chartLabels,
        datasets: [{
            label: 'Total Submissions',
            data: allLabs.map(l => submissions.filter(s => s.labId?._id === l._id || s.labId === l._id).length),
            backgroundColor: '#8b5cf6',
            borderRadius: 6
        }]
    };

    // Chart 3: For Analytics Page
    const statusData = {
        labels: ['Action Required', 'Graded & Approved'],
        datasets: [{
            data: [totalPending, totalApproved],
            backgroundColor: ['#f59e0b', '#10b981'], 
            borderWidth: 0,
            hoverOffset: 4
        }]
    };

    // --- SIDEBAR COMPONENT ---
    const renderSidebar = () => (
        <div style={styles.sidebar}>
            <h3 style={styles.sidebarSectionTitle}>GENERAL</h3>
            
            <button 
                onClick={() => { setActiveView('dashboard'); setSelectedLab(null); }} 
                style={styles.sidebarBtn(activeView === 'dashboard')}
            >
                📊 Dashboard Overview
            </button>
            <button 
                onClick={() => { setActiveView('analytics'); setSelectedLab(null); }} 
                style={styles.sidebarBtn(activeView === 'analytics')}
            >
                📈 Global Analytics
            </button>
            <button onClick={() => navigate('/faculty/manage-labs')} style={styles.sidebarBtn(false)}>
                ⚙️ Manage Labs
            </button>

            <h3 style={{ ...styles.sidebarSectionTitle, marginTop: '24px' }}>YOUR SUBJECTS</h3>
            {allLabs.map(lab => (
                <button 
                    key={lab._id} 
                    onClick={() => handleLabSelect(lab)}
                    style={styles.sidebarBtn(selectedLab?._id === lab._id)}
                >
                    📘 {lab.title}
                </button>
            ))}

            <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                <button onClick={logout} style={styles.logoutBtn}>
                    🚪 Logout
                </button>
            </div>
        </div>
    );

    return (
        <div style={styles.appContainer}>
            {/* Header */}
            <header style={styles.header}>
                <div>
                    <h1 style={styles.headerTitle}>Paperless Lab Record Management System</h1>
                    <span style={styles.headerSubtitle}>Premium Academic Dashboard</span>
                </div>
                
                {/* Top Right Welcome Section */}
                <div style={styles.headerRight}>
                    <span style={styles.welcomeText}>Welcome, {user?.name || "Faculty"}</span>
                    <strong style={styles.roleText}>Smart Faculty Dashboard</strong>
                </div>
            </header>

            {/* Main Layout */}
            <div style={styles.layout}>
                {renderSidebar()}

                <main style={styles.mainContent}>
                    {/* Top Control Bar */}
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

                    {/* Quick Stats Grid */}
                    <div style={styles.statsGrid}>
                        <div style={styles.statCard}>
                            <div style={styles.statDecoCircle} />
                            <h3 style={styles.statValue}>{allLabs.length}</h3>
                            <p style={styles.statLabel}>📁 Total Labs</p>
                        </div>
                        <div style={styles.statCard}>
                            <div style={styles.statDecoCircle} />
                            <h3 style={styles.statValue}>{submissions.length}</h3>
                            <p style={styles.statLabel}>📤 Submissions</p>
                        </div>
                        <div style={styles.statCard}>
                            <div style={styles.statDecoCircle} />
                            <h3 style={styles.statValue}>{totalPending}</h3>
                            <p style={styles.statLabel}>⏳ Pending Review</p>
                        </div>
                        <div style={styles.statCard}>
                            <div style={styles.statDecoCircle} />
                            <h3 style={styles.statValue}>{totalStudents}</h3>
                            <p style={styles.statLabel}>👥 Total Students</p>
                        </div>
                    </div>

                    {/* Dynamic View Routing */}
                    {activeView === 'analytics' ? (
                        <div style={styles.analyticsGrid}>
                            {/* Chart 2: Status Doughnut */}
                            <div style={styles.chartBox}>
                                <h3 style={styles.boxTitle}>Grading Pipeline Status</h3>
                                <div style={{ flex: 1, minHeight: '250px' }}>
                                    <Doughnut data={statusData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
                                </div>
                            </div>

                            {/* Chart 3: Submission Volume */}
                            <div style={styles.chartBox}>
                                <h3 style={styles.boxTitle}>Submission Volume per Subject</h3>
                                <div style={{ height: '250px' }}>
                                    <Bar data={volumeData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                                </div>
                            </div>
                        </div>
                    ) : !selectedLab ? (
                        
                        /* --- DASHBOARD OVERVIEW (Only shows the Chart) --- */
                        <div style={{ ...styles.box, maxWidth: '600px', margin: '0 auto 24px auto', padding: '20px' }}>
                            <h3 style={{...styles.boxTitle, fontSize: '16px', marginBottom: '15px', textAlign: 'center'}}>
                                Performance Across All Labs
                            </h3>
                            <div style={{ height: '200px', width: '100%' }}>
                                <Bar 
                                    data={performanceData} 
                                    options={{ 
                                        maintainAspectRatio: false,
                                        plugins: { legend: { display: false } },
                                        scales: { y: { beginAtZero: true, max: 100 } }
                                    }} 
                                />
                            </div>
                        </div>

                    ) : (

                        /* --- SPECIFIC SUBJECT VIEW (Only shows the Tabs & Table) --- */
                        <div style={styles.box}>
                            {/* Tabs */}
                            <div style={styles.tabsContainer}>
                                <button onClick={() => setViewTab('pending')} style={styles.tabBtn(viewTab === 'pending')}>
                                    Action Required ({totalPending})
                                </button>
                                <button onClick={() => setViewTab('graded')} style={styles.tabBtn(viewTab === 'graded')}>
                                    Graded History ({totalApproved})
                                </button>
                            </div>

                            {/* Table */}
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>Student Details</th>
                                        <th style={styles.th}>Experiment</th>
                                        <th style={styles.th}>Observations</th>
                                        <th style={styles.th}>Status</th>
                                        <th style={styles.th}>Grading</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {submissions.filter(s => {
                                        const matchesTab = viewTab === 'pending' ? s.status !== 'Approved' : s.status === 'Approved';
                                        const matchesSearch = s.studentId?.toLowerCase().includes(searchQuery.toLowerCase());
                                        return matchesTab && matchesSearch;
                                    }).map(sub => (
                                        <tr key={sub._id} style={styles.tr}>
                                            <td style={styles.td}>
                                                <strong style={{ display: 'block', color: '#1f2937' }}>{sub.studentName}</strong>
                                                <span style={styles.rollBadge}>{formatRollNumber(sub.studentId)}</span>
                                            </td>
                                            <td style={styles.td}>{sub.experimentId?.title}</td>
                                            <td style={{ ...styles.td, maxWidth: '250px' }}>
                                                <div style={styles.obsCell} title={sub.observations}>
                                                    {sub.observations}
                                                </div>
                                            </td>
                                            <td style={styles.td}>
                                                <span style={styles.badge(sub.status === 'Approved')}>
                                                    {sub.status || 'Pending'}
                                                </span>
                                            </td>
                                            <td style={styles.td}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <input 
                                                        type="number" 
                                                        value={grades[sub._id] || ""} 
                                                        onChange={(e) => setGrades({...grades, [sub._id]: e.target.value})}
                                                        placeholder="Grade"
                                                        style={styles.gradeInput}
                                                    />
                                                    <button 
                                                        onClick={() => {/* Update Logic */}} 
                                                        style={styles.approveBtn}
                                                    >
                                                        {viewTab === 'pending' ? 'Approve' : 'Save'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {submissions.length === 0 && (
                                        <tr>
                                            <td colSpan="5" style={{ ...styles.td, textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                                                No submissions found for this subject.
                                            </td>
                                        </tr>
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
    sidebarSectionTitle: { fontSize: '12px', color: '#2563eb', margin: '0 0 14px 0', letterSpacing: '1px', fontWeight: 'bold' },
    sidebarBtn: (isActive) => ({
        display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textDecoration: 'none', border: 'none', textAlign: 'left',
        padding: '12px 14px', borderRadius: '10px', marginBottom: '8px', fontSize: '14px', cursor: 'pointer', transition: '0.3s',
        background: isActive ? 'linear-gradient(90deg, #dbeafe, #eff6ff)' : 'transparent',
        color: isActive ? '#1e3a8a' : '#374151', fontWeight: isActive ? '600' : 'normal',
    }),
    logoutBtn: { display: 'flex', alignItems: 'center', gap: '10px', width: '100%', background: 'transparent', border: 'none', textAlign: 'left', padding: '12px 14px', borderRadius: '10px', cursor: 'pointer', color: '#dc2626', fontWeight: 'bold', fontSize: '14px' },

    // Main Content
    mainContent: { flex: 1, padding: '30px', overflowY: 'auto' },
    mainHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' },
    searchInput: { padding: '10px 16px', borderRadius: '20px', border: '1px solid #cbd5e1', outline: 'none', width: '250px', fontSize: '14px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' },

    // Stat Cards
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '22px', marginBottom: '34px' },
    statCard: { background: '#fff', borderRadius: '16px', padding: '22px', boxShadow: '0 8px 20px rgba(0,0,0,0.08)', position: 'relative', overflow: 'hidden' },
    statDecoCircle: { position: 'absolute', right: '-30px', top: '-30px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(37,99,235,0.15)' },
    statValue: { fontSize: '30px', color: '#2563eb', margin: 0, position: 'relative', zIndex: 2 },
    statLabel: { marginTop: '6px', fontSize: '14px', color: '#6b7280', fontWeight: '500', position: 'relative', zIndex: 2 },

    // Analytics Grid
    analyticsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' },
    chartBox: { background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 8px 20px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column' },

    // Content Box
    box: { background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 8px 20px rgba(0,0,0,0.08)', marginBottom: '24px' },
    boxTitle: { color: '#1e3a8a', marginBottom: '20px', marginTop: 0, fontSize: '18px' },
    
    // Tabs
    tabsContainer: { display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: '20px' },
    tabBtn: (isActive) => ({ background: 'none', border: 'none', padding: '12px 24px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginBottom: '-2px', transition: '0.2s', color: isActive ? '#2563eb' : '#6b7280', borderBottom: isActive ? '3px solid #2563eb' : '3px solid transparent' }),

    // Table
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '14px', fontSize: '14px', textAlign: 'left', background: '#eff6ff', color: '#1e3a8a', fontWeight: '600' },
    tr: { transition: 'background 0.2s' },
    td: { padding: '14px', fontSize: '14px', textAlign: 'left', borderBottom: '1px solid #f3f4f6' },
    
    // Elements
    rollBadge: { background: '#e0e7ff', color: '#1e3a8a', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', marginTop: '4px', display: 'inline-block' },
    badge: (isApproved) => ({ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', display: 'inline-block', background: isApproved ? '#dcfce7' : '#fef9c3', color: isApproved ? '#166534' : '#854d0e' }),
    obsCell: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#4b5563', background: '#f9fafb', padding: '8px', borderRadius: '6px', fontSize: '13px' },
    gradeInput: { width: '70px', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', outline: 'none' },
    approveBtn: { padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }
};

export default FacultyDashboard;