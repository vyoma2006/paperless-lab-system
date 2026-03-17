import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ManageLabs = () => {
    const { user } = useContext(AuthContext);
    const [labs, setLabs] = useState([]);
    const [labData, setLabData] = useState({ title: '', code: '' });
    const navigate = useNavigate();

    const fetchLabs = async () => {
        try {
            const { data } = await axios.get(`http://localhost:5001/api/labs/faculty/${user._id}`);
            setLabs(data);
        } catch (err) { console.error("Error fetching labs", err); }
    };

    useEffect(() => { fetchLabs(); }, [user]);

    const handleCreateLab = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5001/api/labs', { 
                ...labData, 
                instructorId: user._id, 
                instructor: user.name 
            });
            alert('✅ Lab Created!');
            setLabData({ title: '', code: '' });
            fetchLabs();
        } catch (err) { alert('❌ Error creating lab'); }
    };

    return (
        <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
            <button onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>
            <h2 style={{ marginTop: '20px' }}>Manage Your Labs</h2>

            {/* Step 1: Create the Lab Container */}
            <section style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', marginBottom: '30px' }}>
                <h3>Create New Lab Group</h3>
                <form onSubmit={handleCreateLab} style={{ display: 'flex', gap: '10px' }}>
                    <input placeholder="Lab Title (e.g. Physics I)" value={labData.title} onChange={e => setLabData({...labData, title: e.target.value})} required style={{ padding: '8px' }} />
                    <input placeholder="Code (e.g. PHY101)" value={labData.code} onChange={e => setLabData({...labData, code: e.target.value})} required style={{ padding: '8px' }} />
                    <button type="submit" style={{ background: '#28a745', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px' }}>Add Lab</button>
                </form>
            </section>

            {/* Step 2: Show List of Labs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                {labs.map(lab => (
                    <div key={lab._id} style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '10px', background: '#fff' }}>
                        <h4>{lab.title}</h4>
                        <p style={{ fontSize: '12px', color: '#666' }}>Code: {lab.code}</p>
                        <button 
                            onClick={() => navigate(`/faculty/manage-manuals/${lab._id}`)}
                            style={{ width: '100%', background: '#007bff', color: 'white', border: 'none', padding: '8px', borderRadius: '5px', cursor: 'pointer' }}
                        >
                            Manage Experiments →
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ManageLabs;