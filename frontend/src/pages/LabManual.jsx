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

    // 1. Fetch Lab and Experiments with Safety Guards
    useEffect(() => {
        const fetchLabDetails = async () => {
            setLoading(true);
            try {
                const labRes = await axios.get('http://localhost:5001/api/labs');
                
                // CRITICAL FIX: Ensure labRes.data is an array before using .find()
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

    // 2. Fetch submission whenever experiment or user changes
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
    doc.setTextColor(22, 53, 92); // Dark Navy Blue
    doc.text("CHARUSAT UNIVERSITY", pageWidth / 2, 25, { align: "center" });
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text("FACULTY OF TECHNOLOGY & ENGINEERING", pageWidth / 2, 32, { align: "center" });
    
    // Horizontal Line
    doc.setDrawColor(200);
    doc.line(margin, 38, pageWidth - margin, 38);

    // --- 2. Lab Metadata Table-style Layout ---
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("Student Name:", margin, 50);
    doc.text("Student ID:", 120, 50);
    doc.text("Subject:", margin, 58);
    doc.text("Date:", 120, 58);

    doc.setFont("helvetica", "normal");
    doc.text(`${user.name}`, margin + 30, 50);
    doc.text(`${user._id.substring(0, 8)}...`, 145, 50); // Shortened ID
    doc.text(`${lab.title}`, margin + 30, 58);
    doc.text(`${new Date(submission.updatedAt).toLocaleDateString()}`, 145, 58);

    // --- 3. Experiment Title Section ---
    doc.setFillColor(245, 247, 250); // Light gray background
    doc.rect(margin, 68, pageWidth - (margin * 2), 12, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(`EXPERIMENT: ${selectedExp.title}`, pageWidth / 2, 76, { align: "center" });

    // --- 4. Content Sections ---
    let currentY = 95;

    // Aim Section
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("AIM:", margin, currentY);
    doc.setFont("helvetica", "normal");
    const aimLines = doc.splitTextToSize(selectedExp.aim, pageWidth - (margin * 2));
    doc.text(aimLines, margin, currentY + 7);
    
    currentY += (aimLines.length * 7) + 15;

    // Observations Section
    doc.setFont("helvetica", "bold");
    doc.text("OBSERVATIONS & ANALYSIS:", margin, currentY);
    doc.line(margin, currentY + 2, margin + 60, currentY + 2); // Underline
    
    doc.setFont("courier", "normal"); // Code/Table look for observations
    doc.setFontSize(10);
    const obsLines = doc.splitTextToSize(submission.observations, pageWidth - (margin * 2));
    doc.text(obsLines, margin, currentY + 12);

    // --- 5. Footer / Certification ---
    const footerY = 270;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("Digitally generated via Paperless Lab Record System", margin, footerY);
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text("Grade Assigned:", 140, footerY - 10);
    doc.setFontSize(14);
    doc.setTextColor(40, 167, 69); // Green
    doc.text(`${submission.grade}/100`, 175, footerY - 10);

    // Final Signature Line
    doc.setDrawColor(0);
    doc.line(140, footerY, 190, footerY);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("Instructor Signature", 153, footerY + 5);

    doc.save(`LabRecord_${selectedExp.title}_${user.name}.pdf`);
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
                <h2 style={{ fontSize: '18px', color: '#63b3ed', marginBottom: '20px' }}>{lab.title}</h2>
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
                            <h1>{selectedExp.title}</h1>
                            {submission?.status === 'Approved' && (
                                <div style={{ background: '#38a169', color: 'white', padding: '8px 15px', borderRadius: '8px', fontWeight: 'bold' }}>
                                    Grade: {submission.grade}/100
                                </div>
                            )}
                        </div>

                        {/* Status/Feedback Box */}
                        {submission && (
                            <div style={{ 
                                padding: '15px', borderRadius: '10px', marginBottom: '25px', 
                                border: '1px solid',
                                background: submission.status === 'Approved' ? '#f0fff4' : submission.status === 'Redo' ? '#fff5f5' : '#fffaf0',
                                color: submission.status === 'Approved' ? '#22543d' : submission.status === 'Redo' ? '#822727' : '#744210'
                            }}>
                                <strong>Status: {submission.status}</strong>
                                {submission.feedback && <p style={{ marginTop: '5px', fontSize: '14px' }}><b>Note:</b> {submission.feedback}</p>}
                            </div>
                        )}

                        <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Aim</h3>
                            <p>{selectedExp.aim}</p>
                            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop: '20px' }}>Procedure</h3>
                            <p style={{ whiteSpace: 'pre-line' }}>{selectedExp.procedure}</p>
                        </div>

                        <div style={{ marginTop: '30px' }}>
                            <h3 style={{ marginBottom: '15px' }}>Your Record</h3>
                            {isLocked ? (
                                <div style={{ padding: '20px', background: '#edf2f7', borderRadius: '12px', border: '1px solid #cbd5e0' }}>
                                    <p style={{ whiteSpace: 'pre-line' }}>{submission.observations}</p>
                                    <div style={{ marginTop: '15px', borderTop: '1px solid #cbd5e0', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '12px', color: '#718096' }}>Locked - {submission.status}</span>
                                        {submission.status === 'Approved' && (
                                            <button onClick={downloadPDF} style={{ background: '#3182ce', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>
                                                Download PDF
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    <textarea 
                                        style={{ width: '100%', minHeight: '180px', padding: '15px', borderRadius: '10px', border: '2px solid #e2e8f0', fontSize: '16px' }}
                                        value={observations}
                                        onChange={(e) => setObservations(e.target.value)}
                                        placeholder="Enter your observations here..."
                                        required
                                    />
                                    <button type="submit" style={{ background: '#38a169', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '8px', marginTop: '15px', cursor: 'pointer', fontWeight: 'bold' }}>
                                        {submission?.status === 'Redo' ? 'Update & Resubmit' : 'Submit Record'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', marginTop: '100px', color: '#a0aec0' }}>
                        <h2>Select an experiment to begin</h2>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LabManual;