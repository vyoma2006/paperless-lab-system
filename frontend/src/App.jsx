import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import LabManual from './pages/LabManual';
import ManageLabs from './pages/ManageLabs'; 
import ManageManuals from './pages/ManageManuals'; 

function App() {
    const { user } = useContext(AuthContext);

    return (
        <Router>
            <Routes>
                {/* 1. Authentication Check */}
                <Route path="/" element={!user ? <Login /> : <Navigate to="/dashboard" />} />

                {/* 2. Updated Unified Dashboard Route */}
                {/* Adding :labId? allows sidebar links like /dashboard/123 to work */}
                <Route 
                    path="/dashboard/:labId?" 
                    element={
                        user ? (
                            user.role === 'faculty' ? <FacultyDashboard /> : <Dashboard />
                        ) : (
                            <Navigate to="/" />
                        )
                    } 
                />

                {/* 3. Student Routes */}
                <Route 
                    path="/lab/:id" 
                    element={user?.role === 'student' ? <LabManual /> : <Navigate to="/" />} 
                />

                {/* 4. Faculty Management Routes */}
                <Route 
                    path="/faculty/manage-labs" 
                    element={user?.role === 'faculty' ? <ManageLabs /> : <Navigate to="/" />} 
                />
                
                <Route 
                    path="/faculty/manage-manuals/:labId" 
                    element={user?.role === 'faculty' ? <ManageManuals /> : <Navigate to="/" />} 
                />

            </Routes>
        </Router>
    );
}

export default App;