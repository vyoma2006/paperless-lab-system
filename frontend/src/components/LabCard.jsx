import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const LabCard = ({ labName, labCode, instructor, id }) => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [status, setStatus] = useState('Not Started');

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                // Check if this student has submitted this lab
                const { data } = await axios.get(`http://localhost:5001/api/submissions/${id}/${user._id}`);
                if (data) setStatus(data.status);
            } catch (err) { console.log("No submission found"); }
        };
        if (user?.role === 'student') fetchStatus();
    }, [id, user]);

    return (
        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '12px', width: '250px', background: '#fff', position: 'relative' }}>
            {/* The Status Badge */}
            <span style={{ 
                position: 'absolute', top: '10px', right: '10px', fontSize: '10px', padding: '4px 8px', borderRadius: '20px',
                background: status === 'Approved' ? '#d4edda' : status === 'Pending' ? '#fff3cd' : '#eee',
                color: status === 'Approved' ? '#155724' : '#856404'
            }}>
                {status}
            </span>

            <h3>{labName}</h3>
            <p style={{ fontSize: '13px' }}>{labCode}</p>
            <button onClick={() => navigate(`/lab/${id}`)} style={{ width: '100%', marginTop: '10px', cursor: 'pointer', background: '#007bff', color: '#fff', border: 'none', borderRadius: '5px', padding: '8px' }}>
                {status === 'Not Started' ? 'Start Lab' : 'View Manual'}
            </button>
        </div>
    );
};

export default LabCard;