import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import * as portalApi from './services/portalApi';
import { MemberProfile, BiometricReading } from './types';

type ActiveSession = { wristband_id: string; member_id: string };

const WristbandManagement = () => {
    const [activeTab, setActiveTab] = useState<'assign' | 'monitor'>('assign');
    const [lastReading, setLastReading] = useState<BiometricReading | null>(null);
    const [members, setMembers] = useState<string[]>([]);
    const [memberProfiles, setMemberProfiles] = useState<Record<string, MemberProfile>>({});
    
    const [memberId, setMemberId] = useState('member-001');
    const [wristbandId, setWristbandId] = useState('wb-demo-001');
    const [availableBoards, setAvailableBoards] = useState<Array<{ board_id: number; name: string; description: string }>>([]);
    const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
    const [ipAddress, setIpAddress] = useState('');
    const [serialNumber, setSerialNumber] = useState('');
    const [maxHeartRateBpm, setMaxHeartRateBpm] = useState('170');
    const [notes, setNotes] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [age, setAge] = useState('30');
    const [weightKg, setWeightKg] = useState('70');
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const refreshMembers = async () => {
        try {
            const { member_ids } = await portalApi.listMembers();
            setMembers(member_ids);
            
            const profiles: Record<string, MemberProfile> = {};
            for (const mid of member_ids) {
                const profile = await portalApi.getMemberProfile(mid);
                profiles[mid] = profile;
            }
            setMemberProfiles(profiles);
        } catch (e) {
            console.error("Failed to refresh members", e);
        }
    };

    useEffect(() => {
        refreshMembers();

        const socket: Socket = io('/', { path: '/socket.io' }); // Assumes same-origin / proxied socket

        socket.on('connect', () => {
            console.log('Connected to WebSocket for wristbands');
            socket.emit('subscribeWristbands');
        });

        socket.on('wristbands_update', (data: { active_sessions: ActiveSession[] }) => {
            setActiveSessions(data.active_sessions || []);
        });

        socket.on('available_boards_update', (boards: Array<{ board_id: number; name: string; description: string }>) => {
            setAvailableBoards(boards || []);
        });

        socket.on('biometricUpdate', (reading: BiometricReading) => {
            setLastReading(reading);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    async function assignSession() {
        setError(null);
        setStatus('Saving profile…');
        try {
            const hr = Number.parseFloat(maxHeartRateBpm);
            await portalApi.updateMemberProfile(memberId.trim(), {
                ...(displayName.trim() ? { name: displayName.trim() } : {}),
                ...(notes.trim() ? { medical_history: notes.trim() } : {}),
                ...(!Number.isNaN(hr) ? { thresholds: { heart_rate_max: hr } } : {}),
            });
            await refreshMembers();
            setStatus('Assigning wristband…');
            await portalApi.assignWristband(
                wristbandId.trim(),
                memberId.trim(),
                ipAddress.trim(),
                serialNumber.trim(),
            );
            setStatus(
                'Session started (UC3 steps 2–8: profile update, assign, pairWristband, thresholds, IoT poll loop).',
            );
        } catch (e) {
            setStatus(null);
            setError(e instanceof Error ? e.message : 'Request failed');
        }
    }

    async function registerNewMember() {
        setError(null);
        setStatus('Registering new member…');
        try {
            const newMemberId = `member-${Date.now().toString().slice(-4)}`;
            await portalApi.registerMember({
                member_id: newMemberId,
                name: displayName.trim() || 'New Member',
                age: Number.parseInt(age, 10) || 30,
                weight_kg: Number.parseFloat(weightKg) || 70.0,
                medical_history: notes.trim() || '',
            });
            await refreshMembers();
            setMemberId(newMemberId);
            setStatus(`Registered new member: ${newMemberId}`);
        } catch (e) {
            setStatus(null);
            setError(e instanceof Error ? e.message : 'Registration failed');
        }
    }

    async function removeCurrentMember() {
        setError(null);
        setStatus('Removing member…');
        try {
            await portalApi.removeMember(memberId.trim());
            await refreshMembers();
            setStatus(`Removed member: ${memberId}`);
            setMemberId('');
        } catch (e) {
            setStatus(null);
            setError(e instanceof Error ? e.message : 'Removal failed');
        }
    }

    async function endSession() {
        setError(null);
        setStatus('Ending session…');
        try {
            await portalApi.onWristbandReturned(wristbandId.trim());
            setLastReading(null);
            setStatus(
                'Session ended (UC3 steps 1–4: staff deregistration, onWristbandReturned, unpairWristband, activeSessions cleared, monitoring stopped).',
            );
        } catch (e) {
            setStatus(null);
            setError(e instanceof Error ? e.message : 'Request failed');
        }
    }

    const activeSession = activeSessions[0]; // "there will only be one for this demo"
    const activeMember = activeSession ? memberProfiles[activeSession.member_id] : null;

    return (
        <div style={{ maxWidth: 600 }}>
            <h1>Wristband Management</h1>
            
            <div style={{ display: 'flex', borderBottom: '1px solid #ccc', marginBottom: '1rem' }}>
                <button 
                    onClick={() => setActiveTab('assign')}
                    style={{ 
                        padding: '0.5rem 1rem', 
                        cursor: 'pointer',
                        border: 'none',
                        background: activeTab === 'assign' ? '#eee' : 'transparent',
                        borderBottom: activeTab === 'assign' ? '2px solid #007bff' : 'none',
                        fontWeight: activeTab === 'assign' ? 'bold' : 'normal'
                    }}
                >
                    Assignment
                </button>
                <button 
                    onClick={() => setActiveTab('monitor')}
                    style={{ 
                        padding: '0.5rem 1rem', 
                        cursor: 'pointer',
                        border: 'none',
                        background: activeTab === 'monitor' ? '#eee' : 'transparent',
                        borderBottom: activeTab === 'monitor' ? '2px solid #007bff' : 'none',
                        fontWeight: activeTab === 'monitor' ? 'bold' : 'normal'
                    }}
                >
                    Monitor
                </button>
            </div>

            {activeTab === 'assign' ? (
                <section style={{ display: 'grid', gap: '0.75rem' }}>
                    <p>
                        UC3 · Staff use wristband assigning: optional <code>updateMemberProfile</code>, then{' '}
                        <code>assignWristband</code>. The backend loads personalized thresholds and starts continuous{' '}
                        <code>pollWristband</code> (simulated hardware via IoT Gateway). When the member returns the band, use{' '}
                        <code>onWristbandReturned</code> to end the session.
                    </p>
                    <div style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: 4 }}>
                        <strong>Detected Wristbands:</strong>
                        {availableBoards.length > 0 ? (
                            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                {availableBoards.map((b, i) => (
                                    <li key={i} style={{ cursor: 'pointer', color: '#007bff' }} onClick={() => setWristbandId(b.name)}>
                                        {b.name} ({b.description}) - ID: {b.board_id}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>No boards detected yet. Status will update automatically.</div>
                        )}
                    </div>

                    <div style={{ padding: '0.5rem', border: '1px solid #ccc', borderRadius: 4 }}>
                        <strong>Active Sessions (Live):</strong>
                        {activeSessions.length > 0 ? (
                            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.9rem' }}>
                                {activeSessions.map((s, i) => (
                                    <li key={i}>
                                        Wristband: {s.wristband_id} | Member: {s.member_id}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>No active wristbands.</div>
                        )}
                    </div>

                    <label>
                        Member ID
                        <select
                            value={memberId}
                            onChange={(e) => {
                                const newId = e.target.value;
                                setMemberId(newId);
                                if (memberProfiles[newId]) {
                                    setDisplayName(memberProfiles[newId].name || '');
                                    setNotes(memberProfiles[newId].medical_history || '');
                                    setAge(memberProfiles[newId].age.toString());
                                    setWeightKg(memberProfiles[newId].weight_kg.toString());
                                    if (memberProfiles[newId].thresholds?.heart_rate_max) {
                                        setMaxHeartRateBpm(memberProfiles[newId].thresholds.heart_rate_max.toString());
                                    }
                                }
                            }}
                            style={{ width: '100%', display: 'block', marginTop: 4, padding: '0.25rem' }}
                        >
                            <option value="">Select a member...</option>
                            {members.map(mid => (
                                <option key={mid} value={mid}>
                                    {mid} {memberProfiles[mid] ? `(${memberProfiles[mid].name})` : ''}
                                </option>
                            ))}
                        </select>
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <input
                            type="text"
                            value={memberId}
                            onChange={(e) => setMemberId(e.target.value)}
                            placeholder="Manual Member ID edit..."
                            style={{ flex: 1, padding: '0.25rem' }}
                        />
                        <button type="button" onClick={registerNewMember} style={{ padding: '0.25rem 0.5rem' }}>Add New</button>
                        <button type="button" onClick={removeCurrentMember} style={{ padding: '0.25rem 0.5rem', backgroundColor: '#d9534f', color: 'white', border: 'none', borderRadius: 3 }}>Remove</button>
                    </div>
                    <label>
                        Wristband ID
                        <input
                            type="text"
                            value={wristbandId}
                            onChange={(e) => setWristbandId(e.target.value)}
                            style={{ width: '100%', display: 'block', marginTop: 4 }}
                        />
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <label style={{ flex: 1 }}>
                            IP Address (Optional)
                            <input
                                type="text"
                                value={ipAddress}
                                placeholder="e.g. 192.168.1.255"
                                onChange={(e) => setIpAddress(e.target.value)}
                                style={{ width: '100%', display: 'block', marginTop: 4 }}
                            />
                        </label>
                        <label style={{ flex: 1 }}>
                            Serial Number (Optional)
                            <input
                                type="text"
                                value={serialNumber}
                                onChange={(e) => setSerialNumber(e.target.value)}
                                style={{ width: '100%', display: 'block', marginTop: 4 }}
                            />
                        </label>
                    </div>
                    <label>
                        Personalized max heart rate (bpm) — optional threshold for this profile
                        <input
                            type="number"
                            value={maxHeartRateBpm}
                            onChange={(e) => setMaxHeartRateBpm(e.target.value)}
                            min={60}
                            max={220}
                            style={{ width: '100%', display: 'block', marginTop: 4 }}
                        />
                    </label>
                    <label>
                        Display name (optional)
                        <input
                            type="text"
                            value={displayName}
                            placeholder="Overwrite display name before assign"
                            onChange={(e) => setDisplayName(e.target.value)}
                            style={{ width: '100%', display: 'block', marginTop: 4 }}
                        />
                    </label>
                    <label>
                        Health notes (optional)
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            style={{ width: '100%', display: 'block', marginTop: 4 }}
                        />
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button type="button" onClick={assignSession}>
                            Save profile &amp; assign wristband
                        </button>
                        <button type="button" onClick={endSession}>
                            Return wristband / end session
                        </button>
                    </div>
                </section>
            ) : (
                <section style={{ textAlign: 'center', padding: '2rem', border: '1px solid #ccc', borderRadius: 8 }}>
                    {!activeSession ? (
                        <p>No active wristband session to monitor. Go to "Assignment" to start one.</p>
                    ) : (
                        <div>
                            <h3>Active Monitoring: {activeSession.wristband_id}</h3>
                            <p>Member: <strong>{activeMember?.name || activeSession.member_id}</strong></p>
                            
                            <div style={{ marginTop: '2rem' }}>
                                <div style={{ fontSize: '4rem', fontWeight: 'bold', color: '#e00' }}>
                                    {lastReading ? Math.round(lastReading.heart_rate) : '--'}
                                    <span style={{ fontSize: '1.5rem', color: '#666', marginLeft: '0.5rem' }}>BPM</span>
                                </div>
                                
                                <div style={{ 
                                    width: 100, 
                                    height: 100, 
                                    margin: '1rem auto',
                                    animation: lastReading && lastReading.heart_rate > 0 ? `pulse ${60 / lastReading.heart_rate}s infinite cubic-bezier(0.215, 0.61, 0.355, 1)` : 'none'
                                }}>
                                    <svg viewBox="0 0 32 32" fill="#e00">
                                        <path d="M16 28.5L14.1 26.75C7.2 20.45 2.5 16.2 2.5 11C2.5 6.6 5.9 3.2 10.3 3.2C12.8 3.2 15.2 4.35 16.7 6.15C18.2 4.35 20.6 3.2 23.1 3.2C27.5 3.2 30.9 6.6 30.9 11C30.9 16.2 26.2 20.45 19.3 26.75L17.4 28.5H16Z" />
                                    </svg>
                                </div>
                                
                                <style>{`
                                    @keyframes pulse {
                                        0% { transform: scale(0.95); }
                                        5% { transform: scale(1.1); }
                                        39% { transform: scale(0.85); }
                                        45% { transform: scale(1); }
                                        60% { transform: scale(0.95); }
                                        100% { transform: scale(0.95); }
                                    }
                                `}</style>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '2rem', fontSize: '0.9rem' }}>
                                    <div style={{ padding: '0.5rem', background: '#f8f9fa', borderRadius: 4 }}>
                                        Temp: {lastReading ? lastReading.temperature.toFixed(1) : '--'}°C
                                    </div>
                                    <div style={{ padding: '0.5rem', background: '#f8f9fa', borderRadius: 4 }}>
                                        EDA: {lastReading ? lastReading.eda.toFixed(2) : '--'}μS
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            )}
            
            {status ? <p style={{ marginTop: '1rem', color: '#0a5' }}>{status}</p> : null}
            {error ? <p style={{ marginTop: '1rem', color: '#a00' }}>{error}</p> : null}
        </div>
    );
};

export default WristbandManagement;
