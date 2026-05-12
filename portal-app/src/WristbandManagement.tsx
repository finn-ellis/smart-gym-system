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

    const [memberId, setMemberId] = useState('');
    const [wristbandId, setWristbandId] = useState('wb-demo-001');
    const [availableBoards, setAvailableBoards] = useState<Array<{ board_id: number; name: string; description: string }>>([]);
    const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
    const [maxHeartRateBpm, setMaxHeartRateBpm] = useState('170');
    const [notes, setNotes] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [age, setAge] = useState('30');
    const [weightKg, setWeightKg] = useState('70');
    const [consentGiven, setConsentGiven] = useState(false);
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
            console.error('Failed to refresh members', e);
        }
    };

    useEffect(() => {
        refreshMembers();
        const socket: Socket = io('/', { path: '/socket.io' });

        socket.on('connect', () => {
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

        return () => { socket.disconnect(); };
    }, []);

    const handleMemberSelect = (newId: string) => {
        setMemberId(newId);
        const profile = memberProfiles[newId];
        if (profile) {
            setDisplayName(profile.name || '');
            setNotes(profile.medical_history || '');
            setAge(profile.age.toString());
            setWeightKg(profile.weight_kg.toString());
            if (profile.thresholds?.heart_rate_max) {
                setMaxHeartRateBpm(profile.thresholds.heart_rate_max.toString());
            }
        }
    };

    async function assignSession() {
        if (!consentGiven) {
            setError('Please confirm the member has signed the consent form before issuing a wristband.');
            return;
        }
        setError(null);
        setStatus('Saving health profile…');
        try {
            const hr = Number.parseFloat(maxHeartRateBpm);
            await portalApi.updateMemberProfile(memberId.trim(), {
                ...(displayName.trim() ? { name: displayName.trim() } : {}),
                ...(notes.trim() ? { medical_history: notes.trim() } : {}),
                ...(!Number.isNaN(hr) ? { thresholds: { heart_rate_max: hr } } : {}),
            });
            await refreshMembers();
            setStatus('Starting biometric monitoring session…');
            await portalApi.assignWristband(
                wristbandId.trim(),
                memberId.trim(),
            );
            setStatus('Session started — wristband is active and monitoring heart rate.');
        } catch (e) {
            setStatus(null);
            setError(e instanceof Error ? e.message : 'Failed to start session');
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
            setStatus(`New member registered: ${newMemberId}`);
        } catch (e) {
            setStatus(null);
            setError(e instanceof Error ? e.message : 'Registration failed');
        }
    }

    async function endSession() {
        setError(null);
        setStatus('Ending session…');
        try {
            await portalApi.onWristbandReturned(wristbandId.trim());
            setLastReading(null);
            setConsentGiven(false);
            setStatus('Session ended — wristband returned and biometric monitoring stopped.');
        } catch (e) {
            setStatus(null);
            setError(e instanceof Error ? e.message : 'Failed to end session');
        }
    }

    const activeSession = activeSessions[0];
    const activeMember = activeSession ? memberProfiles[activeSession.member_id] : null;
    const selectedProfile = memberId ? memberProfiles[memberId] : null;
    const maxHr = selectedProfile?.thresholds?.heart_rate_max;
    const hrExceedsThreshold = lastReading && maxHr && lastReading.heart_rate > maxHr;

    return (
        <div style={{ maxWidth: 960 }}>
            <div className="tabs">
                <button className={`tab-btn${activeTab === 'assign' ? ' active' : ''}`} onClick={() => setActiveTab('assign')}>
                    Issue Wristband
                </button>
                <button className={`tab-btn${activeTab === 'monitor' ? ' active' : ''}`} onClick={() => setActiveTab('monitor')}>
                    Live Monitor
                    {activeSessions.length > 0 && (
                        <span style={{
                            marginLeft: '0.4rem',
                            background: 'var(--success)',
                            color: 'white',
                            borderRadius: '999px',
                            padding: '0 0.4rem',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                        }}>
                            {activeSessions.length}
                        </span>
                    )}
                </button>
            </div>

            {/* ── ASSIGN TAB ─────────────────────────────── */}
            {activeTab === 'assign' && (
                <div className="grid-2" style={{ alignItems: 'start' }}>

                    {/* Left: status panels */}
                    <div className="flex-col gap-2">
                        {/* Active Sessions */}
                        <div className="card">
                            <div className="card-header">
                                <span className="card-title">Active Sessions</span>
                                <span className="status-dot active" title="Live" />
                            </div>
                            <div className="card-body">
                                {activeSessions.length === 0 ? (
                                    <div className="text-muted">No wristbands currently assigned.</div>
                                ) : (
                                    <div className="flex-col gap-1">
                                        {activeSessions.map((s, i) => {
                                            const p = memberProfiles[s.member_id];
                                            return (
                                                <div key={i} style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.65rem',
                                                    padding: '0.5rem 0.6rem',
                                                    background: 'var(--bg)',
                                                    borderRadius: 'var(--radius-sm)',
                                                }}>
                                                    <span className="status-dot active" />
                                                    <div>
                                                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                                            {p?.name || s.member_id}
                                                        </div>
                                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                            {s.wristband_id}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Available Hardware */}
                        <div className="card">
                            <div className="card-header">
                                <span className="card-title">Available Wristbands</span>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>auto-detected</span>
                            </div>
                            <div className="card-body">
                                {availableBoards.length === 0 ? (
                                    <div className="text-muted">No hardware detected yet.</div>
                                ) : (
                                    <div className="flex-col gap-1">
                                        {availableBoards.map((b, i) => (
                                            <button
                                                key={i}
                                                className="btn btn-ghost btn-sm"
                                                style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                                                onClick={() => setWristbandId(b.name)}
                                            >
                                                <span style={{ fontSize: '0.9rem' }}>⌚</span>
                                                <span style={{ fontWeight: 600 }}>{b.name}</span>
                                                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>{b.description}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: enrollment form */}
                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">Session Enrollment</span>
                        </div>
                        <div className="card-body flex-col gap-2">

                            {/* Step 1: Member */}
                            <div>
                                <div className="section-label">1 · Select Member</div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Existing Member</label>
                                        <select
                                            className="form-control"
                                            value={memberId}
                                            onChange={e => handleMemberSelect(e.target.value)}
                                        >
                                            <option value="">Select a member…</option>
                                            {members.map(mid => (
                                                <option key={mid} value={mid}>
                                                    {memberProfiles[mid]?.name
                                                        ? `${memberProfiles[mid].name} (${mid})`
                                                        : mid}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ margin: '0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border)' }} />
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>or register new</span>
                                    <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border)' }} />
                                </div>

                                <div className="form-grid form-grid-2">
                                    <div className="form-group">
                                        <label className="form-label">Name</label>
                                        <input className="form-control" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Full name" />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Age</label>
                                        <input className="form-control" type="number" min={0} value={age} onChange={e => setAge(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Weight (kg)</label>
                                        <input className="form-control" type="number" min={0} value={weightKg} onChange={e => setWeightKg(e.target.value)} />
                                    </div>
                                </div>
                                <button className="btn btn-ghost btn-sm" style={{ marginTop: '0.5rem' }} onClick={registerNewMember}>
                                    + Register as New Member
                                </button>
                            </div>

                            {/* Step 2: Consent */}
                            <div>
                                <div className="section-label">2 · Consent</div>
                                <label className="consent-box">
                                    <input
                                        type="checkbox"
                                        checked={consentGiven}
                                        onChange={e => setConsentGiven(e.target.checked)}
                                    />
                                    <span className="consent-box-text">
                                        The member has reviewed and signed the biometric monitoring consent form.
                                        Monitoring will be limited to heart rate data for safety purposes only.
                                    </span>
                                </label>
                            </div>

                            {/* Step 3: Health Info */}
                            <div>
                                <div className="section-label">3 · Health Information <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></div>
                                <div className="form-grid form-grid-2">
                                    <div className="form-group">
                                        <label className="form-label">Max Heart Rate (bpm)</label>
                                        <input
                                            className="form-control"
                                            type="number"
                                            value={maxHeartRateBpm}
                                            onChange={e => setMaxHeartRateBpm(e.target.value)}
                                            min={60}
                                            max={220}
                                            placeholder="e.g. 170"
                                        />
                                    </div>
                                </div>
                                <div className="form-group" style={{ marginTop: '0.5rem' }}>
                                    <label className="form-label">Relevant Health Notes</label>
                                    <textarea
                                        className="form-control"
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        rows={2}
                                        placeholder="e.g. known heart condition, pacemaker…"
                                    />
                                </div>
                            </div>

                            {/* Step 4: Device */}
                            <div>
                                <div className="section-label">4 · Issue Device</div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Wristband ID</label>
                                        <input
                                            className="form-control"
                                            value={wristbandId}
                                            onChange={e => setWristbandId(e.target.value)}
                                            placeholder="wb-demo-001"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-1" style={{ paddingTop: '0.25rem' }}>
                                <button
                                    className="btn btn-success"
                                    onClick={assignSession}
                                    disabled={!memberId || !wristbandId}
                                >
                                    ▶ Start Session
                                </button>
                                <button
                                    className="btn btn-danger"
                                    onClick={endSession}
                                    disabled={!wristbandId}
                                >
                                    ■ End Session / Return Wristband
                                </button>
                            </div>

                            {status && <div className="status-msg success">{status}</div>}
                            {error && <div className="status-msg error">{error}</div>}
                        </div>
                    </div>
                </div>
            )}

            {/* ── MONITOR TAB ────────────────────────────── */}
            {activeTab === 'monitor' && (
                <div style={{ maxWidth: 520 }}>
                    {!activeSession ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">⌚</div>
                            <div className="empty-state-text">
                                No active wristband session. Go to <strong>Issue Wristband</strong> to start one.
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Member header */}
                            <div className="card mb-3">
                                <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div className="member-avatar" style={{ width: 42, height: 42, fontSize: '0.9rem' }}>
                                        {(activeMember?.name || activeSession.member_id).slice(0, 2).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                                            {activeMember?.name || activeSession.member_id}
                                        </div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                            {activeSession.wristband_id}
                                            {activeMember?.medical_history && (
                                                <span style={{ marginLeft: '0.75rem' }}>· {activeMember.medical_history}</span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="status-dot active" title="Monitoring active" />
                                </div>
                            </div>

                            {/* Heart rate display */}
                            <div className="card mb-3" style={hrExceedsThreshold ? { borderColor: 'var(--critical)', borderWidth: 2 } : {}}>
                                <div className="card-header">
                                    <span className="card-title">Heart Rate</span>
                                    {hrExceedsThreshold && (
                                        <span className="badge badge-critical">⚠ Exceeds threshold</span>
                                    )}
                                    {maxHr && !hrExceedsThreshold && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            Max: {maxHr} bpm
                                        </span>
                                    )}
                                </div>
                                <div className="card-body" style={{ textAlign: 'center', padding: '1.75rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                                        <div
                                            className={`heart-icon${lastReading && lastReading.heart_rate > 0 ? ' beating' : ''}`}
                                            style={{ animationDuration: lastReading ? `${60 / lastReading.heart_rate}s` : '1s' }}
                                        >
                                            <svg width="44" height="44" viewBox="0 0 32 32"
                                                fill={hrExceedsThreshold ? 'var(--critical)' : 'var(--critical)'}
                                                style={{ opacity: hrExceedsThreshold ? 1 : 0.85 }}>
                                                <path d="M16 28.5L14.1 26.75C7.2 20.45 2.5 16.2 2.5 11C2.5 6.6 5.9 3.2 10.3 3.2C12.8 3.2 15.2 4.35 16.7 6.15C18.2 4.35 20.6 3.2 23.1 3.2C27.5 3.2 30.9 6.6 30.9 11C30.9 16.2 26.2 20.45 19.3 26.75L17.4 28.5H16Z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <span style={{
                                                fontSize: '3.5rem',
                                                fontWeight: 800,
                                                color: hrExceedsThreshold ? 'var(--critical)' : 'var(--text)',
                                                lineHeight: 1,
                                            }}>
                                                {lastReading ? Math.round(lastReading.heart_rate) : '—'}
                                            </span>
                                            <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>BPM</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Other biometrics */}
                            <div className="grid-2">
                                <div className="metric-card">
                                    <div className="metric-label">Skin Temperature</div>
                                    <div className="metric-value">
                                        {lastReading ? lastReading.temperature.toFixed(1) : '—'}
                                        <span className="metric-unit"> °C</span>
                                    </div>
                                </div>
                                <div className="metric-card">
                                    <div className="metric-label">EDA</div>
                                    <div className="metric-value">
                                        {lastReading ? lastReading.eda.toFixed(2) : '—'}
                                        <span className="metric-unit"> μS</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default WristbandManagement;
