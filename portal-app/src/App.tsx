import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './App.css';

import ReportBrowsing from './ReportBrowsing';
import GymStateDashboard from './GymStateDashboard';
import AlertsDashboard from './AlertsDashboard';
import MemberProfiles from './MemberProfiles';
import WristbandManagement from './WristbandManagement';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div>
            <nav>
                <ul>
                    <li><Link to="/">Gym State Dashboard</Link></li>
                    <li><Link to="/alerts">Alerts Dashboard</Link></li>
                    <li><Link to="/reports">Report Browsing</Link></li>
                    <li><Link to="/members">Member Profiles</Link></li>
                    <li><Link to="/wristbands">Wristband Management</Link></li>
                </ul>
            </nav>
            <main>
                {children}
            </main>
        </div>
    );
};

function App() {
    return (
        <BrowserRouter>
            <Layout>
                <Routes>
                    <Route path="/" element={<GymStateDashboard />} />
                    <Route path="/alerts" element={<AlertsDashboard />} />
                    <Route path="/reports" element={<ReportBrowsing />} />
                    <Route path="/members" element={<MemberProfiles />} />
                    <Route path="/wristbands" element={<WristbandManagement />} />
                </Routes>
            </Layout>
        </BrowserRouter>
    );
}

export default App;
