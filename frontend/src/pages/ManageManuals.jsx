import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ManageManuals = () => {
    // ---------------------------------------------------------
    // CORE LOGIC (UNCHANGED)
    // ---------------------------------------------------------
    const { labId } = useParams();
    const navigate = useNavigate();
    const [experiments, setExperiments] = useState([]);
    const [expData, setExpData] = useState({ title: '', aim: '', procedure: '', resources: '' });

    const fetchExps = async () => {
        try {
            const { data } = await axios.get(`http://localhost:5001/api/experiments/${labId}`);
            setExperiments(data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchExps(); }, [labId]);

    const handleAddExp = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5001/api/experiments', { ...expData, labId });
            alert('✅ Experiment Added to Manual!');
            setExpData({ title: '', aim: '', procedure: '', resources: '' });
            fetchExps();
        } catch (err) { alert('❌ Error adding experiment'); }
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
                    <span style={styles.headerSubtitle}>Faculty Portal - Manual Builder</span>
                </div>
            </header>

            <main style={styles.mainContent}>
                
                {/* Page Header */}
                <div style={styles.pageHeader}>
                    <button onClick={() => navigate('/faculty/manage-labs')} style={styles.backBtn}>
                        ← Back to Lab List
                    </button>
                    <h2 style={styles.pageTitle}>Lab Manual Builder</h2>
                    <p style={styles.pageSubtitle}>Add and organize experiments for this specific lab group.</p>
                </div>

                <div style={styles.contentGrid}>
                    
                    {/* Left Column: Form Builder */}
                    <div style={styles.builderColumn}>
                        <div style={styles.box}>
                            <h3 style={styles.boxTitle}>Add New Experiment</h3>
                            <form onSubmit={handleAddExp} style={styles.form}>
                                
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Experiment Title</label>
                                    <input 
                                        placeholder="e.g., Exp 1: Verification of Ohm's Law" 
                                        value={expData.title} 
                                        onChange={e => setExpData({...expData, title: e.target.value})} 
                                        required 
                                        style={styles.input} 
                                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                        onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                                    />
                                </div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Aim / Objective</label>
                                    <textarea 
                                        placeholder="State the primary goal of this experiment..." 
                                        value={expData.aim} 
                                        onChange={e => setExpData({...expData, aim: e.target.value})} 
                                        required 
                                        style={{...styles.input, height: '80px', resize: 'vertical'}} 
                                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                        onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                                    />
                                </div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Step-by-Step Procedure</label>
                                    <textarea 
                                        placeholder="1. Connect the circuit as shown...\n2. Turn on the power supply..." 
                                        value={expData.procedure} 
                                        onChange={e => setExpData({...expData, procedure: e.target.value})} 
                                        required 
                                        style={{...styles.input, height: '180px', resize: 'vertical'}} 
                                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                        onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                                    />
                                </div>

                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>Additional Resources (Optional)</label>
                                    <input 
                                        placeholder="Link to YouTube tutorial, PDF guide, or simulator..." 
                                        value={expData.resources} 
                                        onChange={e => setExpData({...expData, resources: e.target.value})} 
                                        style={styles.input} 
                                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                        onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    style={styles.submitBtn}
                                    onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'}
                                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                                >
                                    + Save Experiment to Manual
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right Column: Preview/List */}
                    <div style={styles.previewColumn}>
                        <div style={styles.box}>
                            <h3 style={{...styles.boxTitle, borderBottom: '2px solid #f1f5f9', paddingBottom: '15px'}}>
                                Current Manual Contents ({experiments.length})
                            </h3>
                            
                            {experiments.length === 0 ? (
                                <div style={styles.emptyState}>
                                    No experiments added yet. Use the form to start building this lab manual.
                                </div>
                            ) : (
                                <div style={styles.listContainer}>
                                    {experiments.map((exp, index) => (
                                        <div key={exp._id} style={styles.expCard}>
                                            <div style={styles.expHeader}>
                                                <span style={styles.expIndex}>Exp {index + 1}</span>
                                                <h4 style={styles.expTitle}>{exp.title}</h4>
                                            </div>
                                            
                                            <div style={styles.expSection}>
                                                <strong>Aim:</strong>
                                                <p style={styles.expText}>{exp.aim}</p>
                                            </div>
                                            
                                            <div style={styles.expSection}>
                                                <strong>Procedure:</strong>
                                                <p style={{...styles.expText, whiteSpace: 'pre-line'}}>{exp.procedure}</p>
                                            </div>

                                            {exp.resources && (
                                                <div style={styles.expSection}>
                                                    <strong>Resources:</strong>
                                                    <a href={exp.resources} target="_blank" rel="noreferrer" style={styles.resourceLink}>
                                                        🔗 View Attachment
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

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
        maxWidth: '1200px',
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

    // Layout
    contentGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '30px',
        alignItems: 'start'
    },
    builderColumn: { flex: 1 },
    previewColumn: { flex: 1 },

    // Box Design
    box: { background: '#fff', borderRadius: '16px', padding: '30px', boxShadow: '0 8px 20px rgba(0,0,0,0.06)' },
    boxTitle: { color: '#1f2937', margin: '0 0 25px 0', fontSize: '20px' },
    
    // Form
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { fontSize: '14px', fontWeight: '600', color: '#4b5563' },
    input: {
        width: '100%', padding: '14px 16px', borderRadius: '10px',
        border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '15px',
        outline: 'none', transition: 'all 0.2s ease', fontFamily: 'inherit', boxSizing: 'border-box'
    },
    submitBtn: {
        marginTop: '10px', background: 'linear-gradient(90deg, #10b981, #059669)', color: 'white',
        border: 'none', padding: '16px', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px',
        cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
    },

    // Preview List
    emptyState: { textAlign: 'center', padding: '40px 20px', color: '#6b7280', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' },
    listContainer: { display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '800px', overflowY: 'auto', paddingRight: '10px' },
    expCard: {
        border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px',
        background: '#fcfcfc', transition: 'box-shadow 0.2s'
    },
    expHeader: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' },
    expIndex: { background: '#e0e7ff', color: '#1e3a8a', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold' },
    expTitle: { margin: 0, fontSize: '18px', color: '#1f2937' },
    
    expSection: { marginBottom: '12px' },
    expText: { margin: '6px 0 0 0', color: '#4b5563', fontSize: '14px', lineHeight: '1.6', background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9' },
    resourceLink: { display: 'inline-block', marginTop: '6px', color: '#2563eb', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }
};

export default ManageManuals;