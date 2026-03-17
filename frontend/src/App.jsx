import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import LabManual from './pages/LabManual';
import ManageLabs from './pages/ManageLabs'; // New Import
import ManageManuals from './pages/ManageManuals'; // New Import

function App() {
    const { user } = useContext(AuthContext);

    return (
        <Router>
            <Routes>
                {/* 1. Authentication Check */}
                <Route path="/" element={!user ? <Login /> : <Navigate to="/dashboard" />} />

                {/* 2. Unified Dashboard Route */}
                <Route 
                    path="/dashboard" 
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

                {/* 4. New Faculty Management Routes */}
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