import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { jsPDF } from "jspdf"; 

const LabManual = () => {
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
                // CRITICAL CHANGE: Use roll number/studentId if available, fallback to _id
                studentId: user.studentId || user.rollNumber || user._id, 
                studentName: user.name,
                observations
            });
            alert('✅ Submission successful!');
            window.location.reload();
        } catch (err) { alert('❌ Submission failed'); }
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

        // --- 2. Metadata Section (Updated to show Roll Number) ---
        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.setFont("helvetica", "bold");
        doc.text("Student Name:", margin, 50);
        doc.text("Roll Number:", 120, 50); // Updated Label
        doc.text("Subject:", margin, 58);
        doc.text("Date:", 120, 58);

        doc.setFont("helvetica", "normal");
        doc.text(`${user.name}`, margin + 30, 50);
        // Show actual roll number from submission or user object
        doc.text(`${submission.studentId || user.studentId || user.rollNumber}`, 148, 50); 
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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
            <h3>Loading Lab Record System...</h3>
        </div>
    );

    if (!lab) return (
        <div style={{ padding: '50px', textAlign: 'center' }}>
            <h2>Lab Not Found</h2>
            <button onClick={() => navigate('/dashboard')}>Return to Dashboard</button>
        </div>
    );

    const isLocked = submission && submission.status !== 'Redo';

    return (
        <div style={{ display: 'flex', height: '100vh', fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f0f2f5' }}>
            
            {/* SIDEBAR */}
            <div style={{ width: '300px', background: '#1a202c', color: 'white', padding: '25px', overflowY: 'auto' }}>
                <button 
                    onClick={() => navigate('/dashboard')} 
                    style={{ background: '#4a5568', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', marginBottom: '30px', width: '100%' }}
                >
                    ← Dashboard
                </button>
                <h2 style={{ fontSize: '18px', color: '#63b3ed', marginBottom: '10px' }}>{lab.title}</h2>
                <p style={{ fontSize: '11px', color: '#718096', textTransform: 'uppercase', marginBottom: '20px' }}>
                    Roll No: {user.studentId || user.rollNumber}
                </p>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {experiments.map((exp, index) => (
                        <li 
                            key={exp._id}
                            onClick={() => setSelectedExp(exp)}
                            style={{ 
                                padding: '12px', 
                                marginBottom: '8px', 
                                borderRadius: '8px', 
                                cursor: 'pointer',
                                background: selectedExp?._id === exp._id ? '#2b6cb0' : '#2d3748',
                                transition: '0.3s'
                            }}
                        >
                            {index + 1}. {exp.title}
                        </li>
                    ))}
                </ul>
            </div>

            {/* MAIN CONTENT */}
            <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
                {selectedExp ? (
                    <div style={{ maxWidth: '900px', margin: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h1 style={{ color: '#2d3748' }}>{selectedExp.title}</h1>
                            {submission?.status === 'Approved' && (
                                <div style={{ background: '#38a169', color: 'white', padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                    Grade: {submission.grade}/100
                                </div>
                            )}
                        </div>

                        {submission && (
                            <div style={{ 
                                padding: '15px', borderRadius: '10px', marginBottom: '25px', 
                                border: '1px solid',
                                background: submission.status === 'Approved' ? '#f0fff4' : submission.status === 'Redo' ? '#fff5f5' : '#fffaf0',
                                borderColor: submission.status === 'Approved' ? '#c6f6d5' : submission.status === 'Redo' ? '#fed7d7' : '#feebc8',
                                color: submission.status === 'Approved' ? '#22543d' : submission.status === 'Redo' ? '#822727' : '#744210'
                            }}>
                                <strong>Status: {submission.status}</strong>
                                {submission.feedback && <p style={{ marginTop: '5px', fontSize: '14px' }}><b>Instructor Note:</b> {submission.feedback}</p>}
                            </div>
                        )}

                        <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', color: '#4a5568' }}>Aim</h3>
                            <p style={{ color: '#2d3748', lineHeight: '1.6' }}>{selectedExp.aim}</p>
                            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop: '20px', color: '#4a5568' }}>Procedure</h3>
                            <p style={{ whiteSpace: 'pre-line', color: '#4a5568', lineHeight: '1.6' }}>{selectedExp.procedure}</p>
                        </div>

                        <div style={{ marginTop: '30px' }}>
                            <h3 style={{ marginBottom: '15px', color: '#2d3748' }}>Lab Observations</h3>
                            {isLocked ? (
                                <div style={{ padding: '25px', background: '#edf2f7', borderRadius: '12px', border: '1px solid #cbd5e0' }}>
                                    <p style={{ whiteSpace: 'pre-line', color: '#1a202c', fontFamily: 'monospace' }}>{submission.observations}</p>
                                    <div style={{ marginTop: '20px', borderTop: '1px solid #cbd5e0', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '12px', color: '#718096' }}>Final Record Locked - {new Date(submission.updatedAt).toLocaleDateString()}</span>
                                        {submission.status === 'Approved' && (
                                            <button onClick={downloadPDF} style={{ background: '#3182ce', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                                                📄 Download Official Record
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    <textarea 
                                        style={{ width: '100%', minHeight: '200px', padding: '15px', borderRadius: '10px', border: '2px solid #e2e8f0', fontSize: '16px', outline: 'none', transition: 'border 0.2s' }}
                                        onFocus={(e) => e.target.style.borderColor = '#63b3ed'}
                                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                        value={observations}
                                        onChange={(e) => setObservations(e.target.value)}
                                        placeholder="Enter your observations, calculations, or code snippets here..."
                                        required
                                    />
                                    <button type="submit" style={{ background: '#38a169', color: 'white', border: 'none', padding: '14px 30px', borderRadius: '10px', marginTop: '15px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(56, 161, 105, 0.2)' }}>
                                        {submission?.status === 'Redo' ? '🔄 Resubmit Correction' : '📤 Submit for Review'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', marginTop: '100px', color: '#a0aec0' }}>
                        <h2>Select an experiment from the sidebar to begin.</h2>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LabManual;