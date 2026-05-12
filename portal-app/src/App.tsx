import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import './App.css';

import ReportBrowsing from './ReportBrowsing';
import GymStateDashboard from './GymStateDashboard';
import AlertsDashboard from './AlertsDashboard';
import MemberProfiles from './MemberProfiles';
import WristbandManagement from './WristbandManagement';
import VideoCapture from './VideoCapture';

const NAV_ITEMS = [
    { to: '/', label: 'Gym State', icon: '⬡', subtitle: 'Live facility overview', end: true },
    { to: '/alerts', label: 'Alerts', icon: '⚠', subtitle: 'Health & facility events' },
    { to: '/safety-check', label: 'Safety Check', icon: '📷', subtitle: 'Camera incident analysis' },
    { to: '/wristbands', label: 'Wristbands', icon: '⌚', subtitle: 'Session enrollment' },
    { to: '/members', label: 'Members', icon: '👤', subtitle: 'Health profiles' },
    { to: '/reports', label: 'Reports', icon: '📄', subtitle: 'Activity archive' },
];

const PAGE_META: Record<string, { title: string; subtitle: string; icon: string }> = {
    '/': { title: 'Gym State Dashboard', subtitle: 'Real-time and historical facility state', icon: '⬡' },
    '/alerts': { title: 'Alerts', subtitle: 'Staff notifications · UC4: Warning Health Event Detection', icon: '⚠' },
    '/safety-check': { title: 'Safety Check', subtitle: 'Camera-based incident detection · UC1: Critical Safety Event Detection', icon: '📷' },
    '/wristbands': { title: 'Wristband Management', subtitle: 'Session enrollment & live biometric monitoring · UC3', icon: '⌚' },
    '/members': { title: 'Member Profiles', subtitle: 'Health profiles and personalized thresholds', icon: '👤' },
    '/reports': { title: 'Reports & Archive', subtitle: 'Activity archive · UC5: Facility Data Visibility', icon: '📄' },
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const path = window.location.pathname;
    const meta = PAGE_META[path] ?? PAGE_META['/'];

    return (
        <div className="app-shell">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <div className="sidebar-logo-icon">🏋</div>
                        <div>
                            <div className="sidebar-logo-text">SmartGym</div>
                            <div className="sidebar-logo-sub">Staff Portal</div>
                        </div>
                    </div>
                </div>
                <nav className="sidebar-nav">
                    <div className="sidebar-section-label">Navigation</div>
                    {NAV_ITEMS.map(({ to, label, icon, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                        >
                            <span className="nav-link-icon">{icon}</span>
                            {label}
                        </NavLink>
                    ))}
                </nav>
            </aside>
            <div className="main-content">
                <div className="page-header">
                    <div className="page-header-icon">{meta.icon}</div>
                    <div>
                        <div className="page-title">{meta.title}</div>
                        <div className="page-subtitle">{meta.subtitle}</div>
                    </div>
                </div>
                <div className="page-body">
                    {children}
                </div>
            </div>
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
                    <Route path="/safety-check" element={<VideoCapture />} />
                    <Route path="/reports" element={<ReportBrowsing />} />
                    <Route path="/members" element={<MemberProfiles />} />
                    <Route path="/wristbands" element={<WristbandManagement />} />
                </Routes>
            </Layout>
        </BrowserRouter>
    );
}

export default App;

