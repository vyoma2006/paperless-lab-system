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
    const [submissions, setSubmissions] = useState([]);
    const [grades, setGrades] = useState({});
    const [feedback, setFeedback] = useState({});

    const fetchSubmissions = async () => {
        try {
            const { data } = await axios.get('http://localhost:5001/api/submissions');
            
            // 1. Filter by instructor
            const mySubmissions = data.filter(sub => 
                sub.labId && (sub.labId.instructorId === user._id || sub.labId === user._id)
            );

            // 2. GROUPING LOGIC: Keep only the latest submission per student per experiment
            const grouped = {};
            mySubmissions.forEach(sub => {
                const key = `${sub.studentId}_${sub.experimentId?._id}`;
                if (!grouped[key] || new Date(sub.createdAt) > new Date(grouped[key].createdAt)) {
                    grouped[key] = sub;
                }
            });

            // 3. SORTING LOGIC: Move "Pending" to the top
            const sortedSubmissions = Object.values(grouped).sort((a, b) => {
                if (a.status === 'Pending' && b.status !== 'Pending') return -1;
                if (a.status !== 'Pending' && b.status === 'Pending') return 1;
                return 0;
            });

            setSubmissions(sortedSubmissions);
        } catch (err) { console.error("Error fetching submissions:", err); }
    };

    useEffect(() => { if (user) fetchSubmissions(); }, [user]);

    const prepareChartData = () => {
        const labStats = {};
        submissions.forEach(sub => {
            const title = sub.labId?.title || "Unknown";
            if (!labStats[title]) labStats[title] = { total: 0, count: 0 };
            if (sub.grade > 0) {
                labStats[title].total += sub.grade;
                labStats[title].count += 1;
            }
        });

        return {
            labels: Object.keys(labStats),
            datasets: [{
                label: 'Average Class Grade (%)',
                data: Object.keys(labStats).map(key => labStats[key].total / labStats[key].count || 0),
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
            }]
        };
    };

    const updateStatus = async (id, newStatus) => {
        try {
            const gradeValue = grades[id] || 0;
            const feedbackValue = feedback[id] || "";
            const finalGrade = newStatus === 'Redo' ? 0 : gradeValue;
            
            await axios.patch(`http://localhost:5001/api/submissions/${id}`, { 
                status: newStatus, 
                grade: finalGrade,
                feedback: feedbackValue
            });
            
            alert(`Status updated to: ${newStatus}`);
            fetchSubmissions(); 
        } catch (err) { alert('❌ Failed to update status'); }
    };

    return (
        <div style={{ padding: '30px', fontFamily: 'sans-serif', backgroundColor: '#fdfdfd', minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h1>Faculty Analytics Portal</h1>
                    <p>Welcome, <strong>Prof. {user?.name}</strong></p>
                </div>
                <button onClick={logout} style={{ background: '#ff9800', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' }}>Logout</button>
            </div>

            {/* Navigation Hub */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                <button 
                    onClick={() => navigate('/faculty/manage-labs')}
                    style={{ padding: '20px', fontSize: '18px', background: '#28a745', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    ➕ Manage Labs & Manuals
                </button>
                <div style={{ background: '#eef', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
                    <h2 style={{ margin: 0 }}>{submissions.filter(s => s.status === 'Pending').length}</h2>
                    <p style={{ margin: 0 }}>Pending Reviews</p>
                </div>
            </div>

            {/* Analytics Section */}
            <div style={{ background: '#fff', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '30px', height: '350px' }}>
                <h3 style={{ marginTop: 0 }}>My Labs: Performance Overview</h3>
                <Bar data={prepareChartData()} options={{ maintainAspectRatio: false }} />
            </div>

            {/* Submissions Section */}
            <section style={{ background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <h3 style={{ borderBottom: '2px solid #f4f4f4', paddingBottom: '10px' }}>Review Student Submissions</h3>
                <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                    {submissions.length > 0 ? submissions.map((sub) => (
                        <div key={sub._id} style={{ borderBottom: '1px solid #eee', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <strong style={{ fontSize: '18px' }}>{sub.studentName}</strong> 
                                    <span style={{ color: '#666', marginLeft: '10px', fontSize: '14px' }}>
                                        {sub.labId?.title} — {sub.experimentId?.title}
                                    </span>
                                    <p style={{ fontStyle: 'italic', margin: '10px 0', color: '#444', backgroundColor: '#f9f9f9', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #ddd' }}>
                                        "{sub.observations}"
                                    </p>
                                    <span style={{ 
                                        fontSize: '12px', 
                                        padding: '4px 12px', 
                                        borderRadius: '15px', 
                                        fontWeight: 'bold',
                                        background: sub.status === 'Approved' ? '#d4edda' : sub.status === 'Redo' ? '#f8d7da' : '#fff3cd',
                                        color: sub.status === 'Approved' ? '#155724' : sub.status === 'Redo' ? '#721c24' : '#856404'
                                    }}>
                                        {sub.status.toUpperCase()}
                                    </span>
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '220px' }}>
                                    <input 
                                        type="number" 
                                        placeholder="Enter Grade (0-100)" 
                                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} 
                                        onChange={(e) => setGrades({ ...grades, [sub._id]: e.target.value })} 
                                    />
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button 
                                            onClick={() => updateStatus(sub._id, 'Approved')} 
                                            style={{ flex: 1, background: '#28a745', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                            Approve
                                        </button>
                                        <button 
                                            onClick={() => updateStatus(sub._id, 'Redo')} 
                                            style={{ flex: 1, background: '#dc3545', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                            Redo
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Feedback Section */}
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: '#f0f7ff', padding: '10px', borderRadius: '8px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#0056b3' }}>Feedback:</label>
                                <input 
                                    type="text" 
                                    placeholder="Add notes for student..." 
                                    value={feedback[sub._id] || ""}
                                    style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #b8daff' }}
                                    onChange={(e) => setFeedback({ ...feedback, [sub._id]: e.target.value })}
                                />
                                {sub.feedback && (
                                    <span style={{ fontSize: '11px', color: '#666' }}>
                                        (Last: {sub.feedback})
                                    </span>
                                )}
                            </div>
                        </div>
                    )) : <p style={{ textAlign: 'center', padding: '20px', color: '#888' }}>No submissions found for your labs.</p>}
                </div>
            </section>
        </div>
    );
};

export default FacultyDashboard;