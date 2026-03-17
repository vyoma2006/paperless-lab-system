import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const GradingPortal = () => {
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
            alert('Updated!');
            fetchLabSubmissions();
        } catch (err) { alert('Failed'); }
    };

    return (
        <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
            <button onClick={() => navigate('/faculty-dashboard')}>← Back to Dashboard</button>
            <h1 style={{ marginTop: '20px' }}>Grading Portal: {labTitle}</h1>
            <p>Reviewing all experiments for this specific class.</p>

            <div style={{ marginTop: '30px' }}>
                {submissions.map(sub => (
                    <div key={sub._id} style={{ background: '#fff', padding: '20px', borderRadius: '10px', marginBottom: '15px', border: '1px solid #eee' }}>
                        {/* Use the same card UI we built before */}
                        <strong>{sub.studentName}</strong> - {sub.experimentId?.title}
                        <p>"{sub.observations}"</p>
                        {/* Inputs for Grade and Feedback here... */}
                        <button onClick={() => updateStatus(sub._id, 'Approved')}>Approve</button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GradingPortal;