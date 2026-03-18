import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [enrolledLabs, setEnrolledLabs] = useState([]);
    const [labCode, setLabCode] = useState('');

    const fetchEnrolledLabs = async () => {
        try {
            const { data } = await axios.get(`http://localhost:5001/api/auth/me/${user._id}`);
            setEnrolledLabs(data.enrolledLabs || []);
        } catch (err) {
            console.error("Error fetching enrolled labs", err);
        }
    };

    useEffect(() => {
        if (user?._id) fetchEnrolledLabs();
    }, [user]);

    const handleJoinLab = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5001/api/labs/join', {
                labCode: labCode,
                studentId: user._id
            });
            alert('✅ Successfully joined the lab!');
            setLabCode('');
            fetchEnrolledLabs();
        } catch (err) {
            alert('❌ ' + (err.response?.data?.message || 'Failed to join lab'));
        }
    };

    return (
        <div className="dashboard-container">
            {/* INJECTED STYLES FOR PREMIUM LOOK */}
            <style>{`
                .dashboard-container { min-height: 100vh; background: linear-gradient(135deg,#eef2ff,#f8fafc); font-family: "Segoe UI", sans-serif; color: #1f2937; }
                header { background: linear-gradient(90deg,#1e3a8a,#2563eb,#3b82f6); color: #fff; padding: 18px 30px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
                .layout { display: flex; min-height: calc(100vh - 72px); }
                .sidebar { width: 240px; background: #ffffffee; backdrop-filter: blur(6px); padding: 22px; border-right: 1px solid #e5e7eb; }
                .sidebar h3 { font-size: 14px; color: #2563eb; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 1px; }
                .sidebar a { display: flex; align-items: center; gap: 10px; text-decoration: none; color: #374151; padding: 12px 14px; border-radius: 10px; margin-bottom: 8px; transition: 0.3s; cursor: pointer; }
                .sidebar a:hover, .sidebar a.active { background: linear-gradient(90deg,#dbeafe,#eff6ff); color: #1e3a8a; font-weight: 600; }
                .main { flex: 1; padding: 30px; }
                .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 22px; margin-bottom: 34px; }
                .stat { background: #fff; border-radius: 16px; padding: 22px; box-shadow: 0 8px 20px rgba(0,0,0,0.08); position: relative; overflow: hidden; }
                .stat::after { content: ""; position: absolute; right: -30px; top: -30px; width: 80px; height: 80px; border-radius: 50%; background: rgba(37,99,235,0.15); }
                .stat h3 { font-size: 30px; color: #2563eb; margin: 0; }
                .stat p { margin-top: 6px; font-size: 14px; color: #6b7280; }
                .grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
                .box { background: #fff; border-radius: 16px; padding: 22px; box-shadow: 0 8px 20px rgba(0,0,0,0.08); }
                .join-form { display: flex; gap: 10px; margin-bottom: 20px; }
                .join-input { flex: 1; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; outline: none; transition: 0.3s; }
                .join-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
                .btn-primary { background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; transition: 0.3s; }
                .btn-primary:hover { background: #1e3a8a; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { padding: 14px; font-size: 14px; text-align: left; border-bottom: 1px solid #f1f5f9; }
                th { background: #eff6ff; color: #1e3a8a; font-weight: 600; }
                .badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
                .status-active { background: #dcfce7; color: #166534; }
                ul { list-style: none; padding: 0; }
                ul li { padding: 12px; background: #f1f5f9; border-radius: 10px; margin-bottom: 10px; font-size: 13px; border-left: 4px solid #3b82f6; }
                @media(max-width: 1000px){ .stats { grid-template-columns: repeat(2,1fr); } .grid { grid-template-columns: 1fr; } .sidebar { display:none; } }
            `}</style>

            <header>
                <h1>PLRMS</h1>
                <div style={{ textAlign: 'right' }}>
                    <span style={{ display: 'block', fontSize: '14px', opacity: 0.9 }}>Welcome, {user?.name}</span>
                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Smart Student Dashboard</span>
                </div>
            </header>

            <div className="layout">
                <nav className="sidebar">
                    <h3>Navigation</h3>
                    <a className="active">📊 Dashboard</a>
                    <a>📁 My Labs</a>
                    <a>📤 Submissions</a>
                    <a>📝 Feedback</a>
                    <a>⚙️ Settings</a>
                    <a onClick={logout} style={{ color: '#dc2626' }}>🚪 Logout</a>
                </nav>

                <main className="main">
                    <h2>Dashboard Overview</h2>

                    {/* DYNAMIC STATS CARDS */}
                    <div className="stats">
                        <div className="stat">
                            <h3>{enrolledLabs.length}</h3>
                            <p>📁 Enrolled Labs</p>
                        </div>
                        <div className="stat">
                            <h3>0</h3>
                            <p>📤 Submitted</p>
                        </div>
                        <div className="stat">
                            <h3>0</h3>
                            <p>⏳ Pending Review</p>
                        </div>
                        <div className="stat">
                            <h3>--</h3>
                            <p>🎓 Overall Grade</p>
                        </div>
                    </div>

                    <div className="grid">
                        <div className="left-column">
                            {/* JOIN LAB BOX */}
                            <div className="box" style={{ marginBottom: '24px' }}>
                                <h3>Join a New Lab</h3>
                                <form onSubmit={handleJoinLab} className="join-form">
                                    <input 
                                        type="text" 
                                        className="join-input"
                                        placeholder="Enter Lab Code (e.g. CE252)" 
                                        value={labCode}
                                        onChange={(e) => setLabCode(e.target.value)}
                                        required
                                    />
                                    <button type="submit" className="btn-primary">Join Lab</button>
                                </form>
                            </div>

                            {/* LABS TABLE */}
                            <div className="box">
                                <h3>Your Registered Labs</h3>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Lab Name</th>
                                            <th>Code</th>
                                            <th>Instructor</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {enrolledLabs.length > 0 ? (
                                            enrolledLabs.map(lab => (
                                                <tr key={lab._id}>
                                                    <td style={{ fontWeight: '600' }}>{lab.title}</td>
                                                    <td>{lab.code}</td>
                                                    <td>{lab.instructor || 'Not Assigned'}</td>
                                                    <td><span className="badge status-active">Enrolled</span></td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: 'center', color: '#888', padding: '30px' }}>
                                                    No labs joined yet. Use the form above to get started!
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="right-column">
                            <div className="box">
                                <h3>Notifications</h3>
                                <ul>
                                    <li>🚀 Welcome to PLRMS Dashboard!</li>
                                    <li>🧪 Browse your labs in the left panel.</li>
                                    <li>📢 New lab materials uploaded for DBMS.</li>
                                    <li>⏰ Upcoming deadline for OS Lab.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <footer style={{ textAlign: 'center', marginTop: '40px', color: '#94a3b8', fontSize: '13px' }}>
                        © 2026 Paperless Lab Record Management System
                    </footer>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;