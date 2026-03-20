import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { jsPDF } from "jspdf"; 

const LabManual = () => {
    // ---------------------------------------------------------
    // CORE LOGIC (UNCHANGED)
    // ---------------------------------------------------------
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    
    const [lab, setLab] = useState(null);
    const [experiments, setExperiments] = useState([]);
    const [selectedExp, setSelectedExp] = useState(null);
    const [submission, setSubmission] = useState(null);
    const [observations, setObservations] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLabDetails = async () => {
            setLoading(true);
            try {
                const labRes = await axios.get('http://localhost:5001/api/labs');
                if (labRes.data && Array.isArray(labRes.data)) {
                    const foundLab = labRes.data.find(l => l._id === id);
                    setLab(foundLab);
                }

                const expRes = await axios.get(`http://localhost:5001/api/experiments/${id}`);
                if (expRes.data && Array.isArray(expRes.data)) {
                    setExperiments(expRes.data);
                    if (expRes.data.length > 0) setSelectedExp(expRes.data[0]);
                }
            } catch (err) { 
                console.error("Error fetching lab details", err); 
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchLabDetails();
    }, [id]);

    useEffect(() => {
        const fetchSubmission = async () => {
            if (!selectedExp || !user?._id) return;
            try {
                const subRes = await axios.get(`http://localhost:5001/api/submissions/${id}/${user._id}/${selectedExp._id}`);
                if (subRes.data) {
                    setSubmission(subRes.data);
                    setObservations(subRes.data.observations || '');
                } else {
                    setSubmission(null);
                    setObservations('');
                }
            } catch (err) { 
                setSubmission(null);
                setObservations('');
            }
        };
        fetchSubmission();
    }, [id, user?._id, selectedExp]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5001/api/submissions', {
                labId: id,
                experimentId: selectedExp._id,
                studentId: user._id,
                studentName: user.name,
                observations
            });
            alert('✅ Submission successful!');
            window.location.reload();
        } catch (err) {
            console.error("Error submitting lab report", err);
            alert('❌ Submission failed'); }
    };

    const downloadPDF = () => {
        if (!submission || !selectedExp || !lab) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;

        // --- 1. Formal University Header ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.setTextColor(22, 53, 92); 
        doc.text("CHARUSAT UNIVERSITY", pageWidth / 2, 25, { align: "center" });
        
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text("FACULTY OF TECHNOLOGY & ENGINEERING", pageWidth / 2, 32, { align: "center" });
        doc.setDrawColor(200);
        doc.line(margin, 38, pageWidth - margin, 38);

        // --- 2. Metadata Section ---
        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.setFont("helvetica", "bold");
        doc.text("Student Name:", margin, 50);
        doc.text("Roll Number:", 120, 50);
        doc.text("Subject:", margin, 58);
        doc.text("Date:", 120, 58);

        doc.setFont("helvetica", "normal");
        doc.text(`${user.name}`, margin + 30, 50);
        doc.text(`${user.studentId || user.rollNumber || "N/A"}`, 148, 50); 
        doc.text(`${lab.title}`, margin + 30, 58);
        doc.text(`${new Date(submission.updatedAt).toLocaleDateString()}`, 135, 58);

        // --- 3. Experiment Title ---
        doc.setFillColor(245, 247, 250); 
        doc.rect(margin, 68, pageWidth - (margin * 2), 12, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.text(`EXPERIMENT: ${selectedExp.title}`, pageWidth / 2, 76, { align: "center" });

        let currentY = 95;

        // Aim
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("AIM:", margin, currentY);
        doc.setFont("helvetica", "normal");
        const aimLines = doc.splitTextToSize(selectedExp.aim, pageWidth - (margin * 2));
        doc.text(aimLines, margin, currentY + 7);
        currentY += (aimLines.length * 7) + 15;

        // Observations
        doc.setFont("helvetica", "bold");
        doc.text("OBSERVATIONS & ANALYSIS:", margin, currentY);
        doc.line(margin, currentY + 2, margin + 65, currentY + 2); 
        doc.setFont("courier", "normal"); 
        doc.setFontSize(10);
        const obsLines = doc.splitTextToSize(submission.observations, pageWidth - (margin * 2));
        doc.text(obsLines, margin, currentY + 12);

        // Footer
        const footerY = 270;
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text("Digitally generated via Paperless Lab Record System", margin, footerY);
        
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0);
        doc.text("Grade:", 140, footerY - 10);
        doc.setFontSize(14);
        doc.setTextColor(40, 167, 69); 
        doc.text(`${submission.grade}/100`, 158, footerY - 10);

        doc.line(140, footerY, 190, footerY);
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text("Authorized Instructor Signature", 145, footerY + 5);

        doc.save(`${user.studentId || 'Lab'}_${selectedExp.title}.pdf`);
    };

    if (loading) return (
        <div style={styles.loadingContainer}>
            <h3 style={{ color: '#1e3a8a' }}>Loading Lab Record System...</h3>
        </div>
    );

    if (!lab) return (
        <div style={styles.loadingContainer}>
            <h2 style={{ color: '#1f2937' }}>Lab Not Found</h2>
            <button onClick={() => navigate('/dashboard')} style={styles.submitBtn}>Return to Dashboard</button>
        </div>
    );

    const isLocked = submission && submission.status !== 'Redo';

    // ---------------------------------------------------------
    // PREMIUM UI RENDER
    // ---------------------------------------------------------
    return (
        <div style={styles.appContainer}>
            {/* Top Header */}
            <header style={styles.header}>
                <div>
                    <h1 style={styles.headerTitle}>Paperless Lab Record Management System</h1>
                    <span style={styles.headerSubtitle}>Student Lab Workspace</span>
                </div>
            </header>

            {/* Layout */}
            <div style={styles.layout}>
                
                {/* SIDEBAR */}
                <div style={styles.sidebar}>
                    <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
                        ← Back to Dashboard
                    </button>
                    
                    <h2 style={styles.sidebarLabTitle}>{lab.title}</h2>
                    <p style={styles.sidebarRollNo}>Roll No: {user.studentId || user.rollNumber}</p>
                    
                    <h3 style={{ ...styles.sidebarSectionTitle, marginTop: '20px' }}>EXPERIMENTS</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {experiments.map((exp, index) => (
                            <button 
                                key={exp._id}
                                onClick={() => setSelectedExp(exp)}
                                style={styles.experimentBtn(selectedExp?._id === exp._id)}
                            >
                                {index + 1}. {exp.title}
                            </button>
                        ))}
                    </div>
                </div>

                {/* MAIN CONTENT */}
                <div style={styles.mainContent}>
                    {selectedExp ? (
                        <div style={{ maxWidth: '900px', margin: 'auto' }}>
                            
                            {/* Content Header */}
                            <div style={styles.mainHeader}>
                                <h1 style={styles.pageTitle}>{selectedExp.title}</h1>
                                {submission?.status === 'Approved' && (
                                    <div style={styles.gradeBadge}>
                                        Grade: {submission.grade}/100
                                    </div>
                                )}
                            </div>

                            {/* Status Banner */}
                            {submission && (
                                <div style={styles.statusBanner(submission.status)}>
                                    <strong style={{ fontSize: '15px' }}>Status: {submission.status}</strong>
                                    {submission.feedback && (
                                        <p style={{ marginTop: '8px', fontSize: '14px', marginBottom: 0 }}>
                                            <b>Instructor Feedback:</b> {submission.feedback}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Aim & Procedure Box */}
                            <div style={styles.box}>
                                <h3 style={styles.sectionTitle}>Aim</h3>
                                <p style={styles.sectionText}>{selectedExp.aim}</p>
                                
                                <h3 style={{ ...styles.sectionTitle, marginTop: '24px' }}>Procedure</h3>
                                <p style={styles.sectionText}>{selectedExp.procedure}</p>
                            </div>

                            {/* Observations Section */}
                            <div style={{ marginTop: '30px' }}>
                                <h3 style={{ color: '#1e3a8a', marginBottom: '16px' }}>Lab Observations & Analysis</h3>
                                
                                {isLocked ? (
                                    <div style={styles.box}>
                                        <p style={styles.lockedText}>{submission.observations}</p>
                                        <div style={styles.lockedFooter}>
                                            <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                                                🔒 Final Record Locked - {new Date(submission.updatedAt).toLocaleDateString()}
                                            </span>
                                            {submission.status === 'Approved' && (
                                                <button onClick={downloadPDF} style={styles.downloadBtn}>
                                                    📄 Download Official PDF
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} style={styles.box}>
                                        <textarea 
                                            style={styles.textArea}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = '#3b82f6';
                                                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = '#cbd5e1';
                                                e.target.style.boxShadow = 'none';
                                            }}
                                            value={observations}
                                            onChange={(e) => setObservations(e.target.value)}
                                            placeholder="Enter your observations, calculations, output data, or code snippets here..."
                                            required
                                        />
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                                            <button type="submit" style={styles.submitBtn}>
                                                {submission?.status === 'Redo' ? '🔄 Resubmit Correction' : '📤 Submit for Review'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div style={styles.emptyState}>
                            <h2>Select an experiment from the sidebar to begin.</h2>
                        </div>
                    )}
                </div>
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
    loadingContainer: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc' },
    
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
        width: '280px',
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(6px)',
        padding: '24px',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto'
    },
    backBtn: {
        background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0',
        padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', marginBottom: '24px',
        width: '100%', fontWeight: '600', transition: '0.2s', textAlign: 'center'
    },
    sidebarLabTitle: { fontSize: '18px', color: '#1e3a8a', margin: '0 0 8px 0' },
    sidebarRollNo: { fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', margin: '0 0 20px 0', fontWeight: '600' },
    sidebarSectionTitle: { fontSize: '13px', color: '#2563eb', margin: '0 0 14px 0', letterSpacing: '1px' },
    experimentBtn: (isActive) => ({
        display: 'block', width: '100%', textAlign: 'left', padding: '12px 14px',
        borderRadius: '10px', border: 'none', fontSize: '14px', cursor: 'pointer', transition: '0.2s',
        background: isActive ? 'linear-gradient(90deg, #dbeafe, #eff6ff)' : 'transparent',
        color: isActive ? '#1e3a8a' : '#374151',
        fontWeight: isActive ? '600' : 'normal',
    }),

    // Main Content
    mainContent: { flex: 1, padding: '40px', overflowY: 'auto' },
    mainHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    pageTitle: { color: '#1e3a8a', fontSize: '28px', margin: 0 },
    gradeBadge: { background: '#10b981', color: 'white', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)' },
    emptyState: { textAlign: 'center', marginTop: '100px', color: '#6b7280' },

    // Banner
    statusBanner: (status) => ({
        padding: '16px', borderRadius: '12px', marginBottom: '24px', border: '1px solid',
        background: status === 'Approved' ? '#dcfce7' : status === 'Redo' ? '#fee2e2' : '#fef9c3',
        borderColor: status === 'Approved' ? '#bbf7d0' : status === 'Redo' ? '#fecaca' : '#fef08a',
        color: status === 'Approved' ? '#166534' : status === 'Redo' ? '#991b1b' : '#854d0e',
    }),

    // Content Boxes
    box: { background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 8px 20px rgba(0,0,0,0.08)' },
    sectionTitle: { borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', color: '#1e3a8a', margin: '0 0 16px 0' },
    sectionText: { whiteSpace: 'pre-line', color: '#4b5563', lineHeight: '1.7', margin: 0 },

    // Observations Area
    textArea: {
        width: '100%', minHeight: '220px', padding: '16px', borderRadius: '12px',
        border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', transition: 'all 0.2s',
        fontFamily: 'monospace', background: '#f8fafc', color: '#1f2937', resize: 'vertical'
    },
    submitBtn: {
        background: '#3b82f6', color: 'white', border: 'none', padding: '12px 28px',
        borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)', transition: '0.2s'
    },
    lockedText: { whiteSpace: 'pre-line', color: '#1f2937', fontFamily: 'monospace', margin: '0 0 20px 0', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' },
    lockedFooter: { borderTop: '1px solid #e2e8f0', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    downloadBtn: {
        background: '#1e3a8a', color: 'white', border: 'none', padding: '10px 20px',
        borderRadius: '8px', cursor: 'pointer', fontWeight: '600', transition: '0.2s',
        boxShadow: '0 4px 6px rgba(30, 58, 138, 0.2)'
    }
};

export default LabManual;