import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const GradingPortal = () => {
    // ---------------------------------------------------------
    // CORE LOGIC (UNCHANGED)
    // ---------------------------------------------------------
    const { labId } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [submissions, setSubmissions] = useState([]);
    const [labTitle, setLabTitle] = useState('');
    const [grades, setGrades] = useState({});
    const [feedback, setFeedback] = useState({});

    const fetchLabSubmissions = async () => {
        try {
            const { data } = await axios.get('http://localhost:5001/api/submissions');
            // Filter ONLY for this specific Lab ID
            const filtered = data.filter(sub => sub.labId?._id === labId);
            
            // Grouping logic (keep latest)
            const grouped = {};
            filtered.forEach(sub => {
                const key = `${sub.studentId}_${sub.experimentId?._id}`;
                if (!grouped[key] || new Date(sub.createdAt) > new Date(grouped[key].createdAt)) {
                    grouped[key] = sub;
                }
            });

            const sorted = Object.values(grouped).sort((a, b) => (a.status === 'Pending' ? -1 : 1));
            setSubmissions(sorted);
            if (sorted.length > 0) setLabTitle(sorted[0].labId.title);

            // Pre-fill existing grades and feedback into state
            const initGrades = {};
            const initFeedback = {};
            sorted.forEach(s => {
                initGrades[s._id] = s.grade || "";
                initFeedback[s._id] = s.feedback || "";
            });
            setGrades(initGrades);
            setFeedback(initFeedback);

        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchLabSubmissions(); }, [labId]);

    const updateStatus = async (id, newStatus) => {
        try {
            await axios.patch(`http://localhost:5001/api/submissions/${id}`, { 
                status: newStatus, 
                grade: grades[id] || 0,
                feedback: feedback[id] || ""
            });
            alert('Submission Updated Successfully!');
            fetchLabSubmissions();
        } catch (err) { alert('Failed to update submission'); }
    };

    const formatRollNumber = (id) => {
        if (!id || id.length > 15) return id?.substring(id.length - 5).toUpperCase() || "N/A";
        return id.toUpperCase();
    };

    // ---------------------------------------------------------
    // PREMIUM UI RENDER
    // ---------------------------------------------------------
    return (
        <div style={styles.appContainer}>
            {/* Top Header */}
            <header style={styles.header}>
                <div>
                    <h1 style={styles.headerTitle}>Paperless Lab Record Management System</h1>
                    <span style={styles.headerSubtitle}>Faculty Grading Portal</span>
                </div>
            </header>

            <main style={styles.mainContent}>
                <div style={styles.pageHeader}>
                    <button onClick={() => navigate('/faculty-dashboard')} style={styles.backBtn}>
                        ← Back to Dashboard
                    </button>
                    <h2 style={styles.pageTitle}>{labTitle || "Loading Lab..."}</h2>
                    <p style={styles.pageSubtitle}>Reviewing all pending and graded experiments for this specific class.</p>
                </div>

                <div style={styles.submissionsGrid}>
                    {submissions.length === 0 ? (
                        <div style={styles.emptyState}>No submissions found for this lab yet.</div>
                    ) : (
                        submissions.map(sub => (
                            <div key={sub._id} style={styles.card}>
                                {/* Card Header */}
                                <div style={styles.cardHeader}>
                                    <div>
                                        <h3 style={styles.studentName}>{sub.studentName}</h3>
                                        <span style={styles.rollBadge}>{formatRollNumber(sub.studentId)}</span>
                                        <p style={styles.experimentTitle}>📘 {sub.experimentId?.title}</p>
                                    </div>
                                    <span style={styles.badge(sub.status === 'Approved')}>
                                        {sub.status || 'Pending'}
                                    </span>
                                </div>

                                {/* Card Body (Observations) */}
                                <div style={styles.observationsBox}>
                                    <strong>Observations / Output:</strong>
                                    <p style={{ margin: '8px 0 0 0', color: '#4b5563' }}>
                                        {sub.observations || "No observations provided."}
                                    </p>
                                </div>

                                {/* Card Footer (Grading Controls) */}
                                <div style={styles.gradingSection}>
                                    <div style={{ flex: 1 }}>
                                        <input 
                                            type="text" 
                                            placeholder="Add constructive feedback..." 
                                            value={feedback[sub._id] || ""}
                                            onChange={(e) => setFeedback({...feedback, [sub._id]: e.target.value})}
                                            style={styles.feedbackInput}
                                        />
                                    </div>
                                    <input 
                                        type="number" 
                                        placeholder="Grade (0-10)" 
                                        value={grades[sub._id] || ""}
                                        onChange={(e) => setGrades({...grades, [sub._id]: e.target.value})}
                                        style={styles.gradeInput}
                                    />
                                    <button 
                                        onClick={() => updateStatus(sub._id, 'Approved')}
                                        style={styles.approveBtn(sub.status === 'Approved')}
                                    >
                                        {sub.status === 'Approved' ? 'Update Grade' : 'Approve & Grade'}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
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
    },
    headerTitle: { fontSize: '22px', margin: '0 0 4px 0' },
    headerSubtitle: { fontSize: '13px', opacity: 0.9 },
    
    mainContent: {
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '40px 20px',
        width: '100%'
    },
    pageHeader: { marginBottom: '30px' },
    backBtn: {
        background: 'transparent', border: 'none', color: '#2563eb', fontSize: '15px',
        fontWeight: '600', cursor: 'pointer', padding: '0 0 15px 0', display: 'inline-block'
    },
    pageTitle: { color: '#1e3a8a', fontSize: '28px', margin: '0 0 8px 0' },
    pageSubtitle: { color: '#6b7280', fontSize: '15px', margin: 0 },

    submissionsGrid: { display: 'flex', flexDirection: 'column', gap: '24px' },
    emptyState: { textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '16px', color: '#6b7280', boxShadow: '0 8px 20px rgba(0,0,0,0.08)' },

    card: {
        background: '#fff', borderRadius: '16px', padding: '24px',
        boxShadow: '0 8px 20px rgba(0,0,0,0.08)', transition: 'transform 0.2s'
    },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f3f4f6', paddingBottom: '16px', marginBottom: '16px' },
    studentName: { fontSize: '18px', color: '#1f2937', margin: '0 10px 0 0', display: 'inline-block' },
    rollBadge: { background: '#e0e7ff', color: '#1e3a8a', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' },
    experimentTitle: { margin: '8px 0 0 0', color: '#4b5563', fontSize: '14px', fontWeight: '500' },
    
    badge: (isApproved) => ({
        padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', display: 'inline-block',
        background: isApproved ? '#dcfce7' : '#fef9c3',
        color: isApproved ? '#166534' : '#854d0e'
    }),

    observationsBox: {
        background: '#f9fafb', padding: '16px', borderRadius: '10px', fontSize: '14px',
        border: '1px solid #f3f4f6', marginBottom: '20px', lineHeight: '1.5'
    },

    gradingSection: { display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' },
    feedbackInput: {
        width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1',
        fontSize: '14px', outline: 'none', background: '#fff'
    },
    gradeInput: {
        width: '120px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1',
        fontSize: '15px', textAlign: 'center', fontWeight: 'bold', outline: 'none'
    },
    approveBtn: (isApproved) => ({
        padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', border: 'none', transition: '0.2s',
        background: isApproved ? '#3b82f6' : '#10b981',
        color: '#fff',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    })
};

export default GradingPortal;