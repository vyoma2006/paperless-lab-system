import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ManageManuals = () => {
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

    return (
        <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
            <button onClick={() => navigate('/faculty/manage-labs')}>← Back to Lab List</button>
            <h2 style={{ marginTop: '20px' }}>Manual Builder</h2>

            <form onSubmit={handleAddExp} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '600px', background: '#eef', padding: '20px', borderRadius: '10px' }}>
                <h3>Add New Experiment</h3>
                <input placeholder="Title (e.g. Exp 1: Ohm's Law)" value={expData.title} onChange={e => setExpData({...expData, title: e.target.value})} required style={{ padding: '8px' }} />
                <textarea placeholder="Aim" value={expData.aim} onChange={e => setExpData({...expData, aim: e.target.value})} required style={{ padding: '8px', height: '60px' }} />
                <textarea placeholder="Procedure" value={expData.procedure} onChange={e => setExpData({...expData, procedure: e.target.value})} required style={{ padding: '8px', height: '100px' }} />
                <input placeholder="Resource Link (YouTube/PDF)" value={expData.resources} onChange={e => setExpData({...expData, resources: e.target.value})} style={{ padding: '8px' }} />
                <button type="submit" style={{ background: '#007bff', color: 'white', padding: '10px', border: 'none', borderRadius: '5px' }}>Save Experiment</button>
            </form>

            <hr style={{ margin: '40px 0' }} />

            <h3>Current Lab Manual Contents</h3>
            {experiments.map((exp, index) => (
                <div key={exp._id} style={{ borderBottom: '1px solid #eee', padding: '15px 0' }}>
                    <h4>{index + 1}. {exp.title}</h4>
                    <p><strong>Aim:</strong> {exp.aim}</p>
                    <p style={{ fontSize: '14px', whiteSpace: 'pre-line' }}><strong>Procedure:</strong> {exp.procedure}</p>
                </div>
            ))}
        </div>
    );
};

export default ManageManuals;