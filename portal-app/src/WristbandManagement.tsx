import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import * as portalApi from './services/portalApi';
import { MemberProfile } from './types';

type ActiveSession = { wristband_id: string; member_id: string };

const WristbandManagement = () => {
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
            setStatus(
                'Session ended (UC3 steps 1–4: staff deregistration, onWristbandReturned, unpairWristband, activeSessions cleared, monitoring stopped).',
            );
        } catch (e) {
            setStatus(null);
            setError(e instanceof Error ? e.message : 'Request failed');
        }
    }

    return (
        <div style={{ maxWidth: 560 }}>
            <h1>Wristband Management</h1>
            <p>
                UC3 · Staff use wristband assigning: optional <code>updateMemberProfile</code>, then{' '}
                <code>assignWristband</code>. The backend loads personalized thresholds and starts continuous{' '}
                <code>pollWristband</code> (simulated hardware via IoT Gateway). When the member returns the band, use{' '}
                <code>onWristbandReturned</code> to end the session.
            </p>
            <section style={{ display: 'grid', gap: '0.75rem', marginTop: '1.25rem' }}>
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
            {status ? <p style={{ marginTop: '1rem', color: '#0a5' }}>{status}</p> : null}
            {error ? <p style={{ marginTop: '1rem', color: '#a00' }}>{error}</p> : null}
        </div>
    );
};

export default WristbandManagement;
