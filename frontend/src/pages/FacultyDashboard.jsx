import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const FacultyDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    
    // UI State
    const [activeView, setActiveView] = useState('analytics'); // 'analytics' or 'lab-detail'
    const [selectedLab, setSelectedLab] = useState(null); // The specific lab object
    const [viewTab, setViewTab] = useState('pending'); // 'pending' or 'graded'
    
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
            
            // Filter by instructor
            const mySubmissions = data.filter(sub => 
                sub.labId && (sub.labId.instructorId === user._id || sub.labId === user._id)
            );

            // Grouping for latest submission
            const grouped = {};
            mySubmissions.forEach(sub => {
                const key = `${sub.studentId}_${sub.experimentId?._id}`;
                if (!grouped[key] || new Date(sub.createdAt) > new Date(grouped[key].createdAt)) {
                    grouped[key] = sub;
                }
            });

            const sorted = Object.values(grouped);
            setSubmissions(sorted);

            // Sync grades/feedback state
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

    // Trigger fetch when lab changes
    useEffect(() => {
        if (selectedLab) {
            fetchSubmissions(selectedLab._id);
        } else {
            fetchSubmissions('all');
        }
    }, [selectedLab]);

    const handleLabSelect = (lab) => {
        setSelectedLab(lab);
        setActiveView('lab-detail');
        setViewTab('pending');
    };

    // --- SIDEBAR COMPONENT ---
    const renderSidebar = () => (
        <div style={{ width: '280px', background: '#1a202c', color: 'white', display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <div style={{ padding: '30px 20px', borderBottom: '1px solid #2d3748' }}>
                <h2 style={{ fontSize: '18px', color: '#63b3ed', margin: 0 }}>Faculty Portal</h2>
                <span style={{ fontSize: '12px', color: '#718096' }}>{user.name}</span>
            </div>

            <nav style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                <p style={sectionLabelStyle}>General</p>
                <button 
                    onClick={() => { setActiveView('analytics'); setSelectedLab(null); }} 
                    style={sidebarBtnStyle(activeView === 'analytics')}
                >
                    📊 Global Analytics
                </button>
                <button onClick={() => navigate('/faculty/manage-labs')} style={sidebarBtnStyle(false)}>
                    ⚙️ Manage Labs
                </button>

                <p style={{ ...sectionLabelStyle, marginTop: '30px' }}>Your Subjects</p>
                {allLabs.map(lab => (
                    <button 
                        key={lab._id} 
                        onClick={() => handleLabSelect(lab)}
                        style={sidebarBtnStyle(selectedLab?._id === lab._id)}
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
        <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f7fafc' }}>
            {renderSidebar()}

            <main style={{ flex: 1, overflowY: 'auto', padding: '40px' }}>
                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h1 style={{ color: '#2d3748', margin: 0 }}>
                        {selectedLab ? selectedLab.title : "Global Overview"}
                    </h1>
                    <div style={{ background: 'white', padding: '5px 15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <input 
                            placeholder="Search Roll No..." 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ border: 'none', outline: 'none', padding: '8px' }}
                        />
                    </div>
                </div>

                {activeView === 'analytics' ? (
                    <div style={{ background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <h3>Performance Across All Labs</h3>
                        <div style={{ height: '350px' }}>
                            <Bar 
                                data={{
                                    labels: allLabs.map(l => l.title),
                                    datasets: [{ label: 'Avg Grade', data: [88, 76, 92], backgroundColor: '#4299e1' }]
                                }} 
                                options={{ maintainAspectRatio: false }} 
                            />
                        </div>
                    </div>
                ) : (
                    <section style={{ background: 'white', borderRadius: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', borderBottom: '1px solid #edf2f7' }}>
                            <button onClick={() => setViewTab('pending')} style={tabStyle(viewTab === 'pending')}>Action Required</button>
                            <button onClick={() => setViewTab('graded')} style={tabStyle(viewTab === 'graded')}>Graded History</button>
                        </div>

                        <div style={{ padding: '20px' }}>
                            {submissions.filter(s => {
                                const matchesTab = viewTab === 'pending' ? s.status !== 'Approved' : s.status === 'Approved';
                                const matchesSearch = s.studentId?.toLowerCase().includes(searchQuery.toLowerCase());
                                return matchesTab && matchesSearch;
                            }).map(sub => (
                                <div key={sub._id} style={submissionCardStyle}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <strong style={{ fontSize: '16px' }}>{sub.studentName}</strong>
                                            <span style={rollBadgeStyle}>{formatRollNumber(sub.studentId)}</span>
                                        </div>
                                        <p style={{ margin: '5px 0', color: '#4a5568', fontSize: '14px' }}>{sub.experimentId?.title}</p>
                                        <div style={{ background: '#f7fafc', padding: '10px', borderRadius: '6px', fontSize: '13px', margin: '10px 0' }}>
                                            {sub.observations}
                                        </div>
                                    </div>
                                    
                                    <div style={{ minWidth: '200px', textAlign: 'right' }}>
                                        <input 
                                            type="number" 
                                            value={grades[sub._id] || ""} 
                                            onChange={(e) => setGrades({...grades, [sub._id]: e.target.value})}
                                            style={gradeInputStyle}
                                        />
                                        <button 
                                            onClick={() => {/* Update Logic */}} 
                                            style={approveBtnStyle}
                                        >
                                            {viewTab === 'pending' ? 'Approve' : 'Save'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
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
const tabStyle = (isActive) => ({ padding: '15px 30px', border: 'none', background: 'none', borderBottom: isActive ? '3px solid #3182ce' : 'none', color: isActive ? '#3182ce' : '#718096', fontWeight: 'bold', cursor: 'pointer' });
const submissionCardStyle = { display: 'flex', padding: '20px', borderBottom: '1px solid #f7fafc', gap: '20px', alignItems: 'flex-start' };
const rollBadgeStyle = { background: '#ebf8ff', color: '#2c5282', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' };
const gradeInputStyle = { width: '60px', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', marginBottom: '10px', textAlign: 'center', fontWeight: 'bold' };
const approveBtnStyle = { width: '100%', padding: '8px', background: '#38a169', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' };

export default FacultyDashboard;