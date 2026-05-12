import { useEffect, useState } from 'react';
import * as portalApi from './services/portalApi';
import { MemberProfile } from './types';

const MemberProfiles = () => {
    const [profiles, setProfiles] = useState<MemberProfile[]>([]);
    const [selectedProfile, setSelectedProfile] = useState<MemberProfile | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [age, setAge] = useState<number | ''>('');
    const [weight, setWeight] = useState<number | ''>('');
    const [history, setHistory] = useState('');
    const [hrMax, setHrMax] = useState<number | ''>('');
    const [hrMin, setHrMin] = useState<number | ''>('');

    const loadProfiles = async () => {
        try {
            const { member_ids } = await portalApi.listMembers();
            const loaded = await Promise.all(member_ids.map(id => portalApi.getMemberProfile(id)));
            setProfiles(loaded);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load profiles');
        }
    };

    useEffect(() => { loadProfiles(); }, []);

    const clearForm = () => {
        setSelectedProfile(null);
        setName(''); setAge(''); setWeight(''); setHistory(''); setHrMax(''); setHrMin('');
        setError(null); setStatus(null);
    };

    const handleSelect = (profile: MemberProfile) => {
        setSelectedProfile(profile);
        setName(profile.name || '');
        setAge(profile.age || '');
        setWeight(profile.weight_kg || '');
        setHistory(profile.medical_history || '');
        setHrMax(profile.thresholds?.heart_rate_max ?? '');
        setHrMin(profile.thresholds?.heart_rate_min ?? '');
        setError(null); setStatus(null);
    };

    const handleCreate = async () => {
        setError(null);
        try {
            const newMemberId = `member-${Date.now().toString().slice(-4)}`;
            await portalApi.registerMember({
                member_id: newMemberId,
                name,
                age: Number(age) || 0,
                weight_kg: Number(weight) || 0,
                medical_history: history,
            });
            await loadProfiles();
            setStatus(`Member ${newMemberId} created.`);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Create failed');
        }
    };

    const handleUpdate = async () => {
        if (!selectedProfile) return;
        setError(null);
        try {
            await portalApi.updateMemberProfile(selectedProfile.member_id, {
                name,
                age: Number(age) || 0,
                weight_kg: Number(weight) || 0,
                medical_history: history,
                ...(hrMax !== '' || hrMin !== '' ? {
                    thresholds: {
                        ...(hrMax !== '' ? { heart_rate_max: Number(hrMax) } : {}),
                        ...(hrMin !== '' ? { heart_rate_min: Number(hrMin) } : {}),
                    },
                } : {}),
            });
            await loadProfiles();
            setStatus('Profile updated.');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Update failed');
        }
    };

    const handleDelete = async (id: string) => {
        setError(null);
        try {
            await portalApi.removeMember(id);
            if (selectedProfile?.member_id === id) clearForm();
            await loadProfiles();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Delete failed');
        }
    };

    const isEditing = !!selectedProfile;

    return (
        <div className="grid-2" style={{ alignItems: 'start', maxWidth: 900 }}>
            {/* Member list */}
            <div className="card">
                <div className="card-header">
                    <span className="card-title">Members ({profiles.length})</span>
                    <button className="btn btn-primary btn-sm" onClick={clearForm}>
                        + New
                    </button>
                </div>
                <div className="card-body" style={{ padding: '0.5rem 0' }}>
                    {error && !isEditing && <div className="status-msg error" style={{ margin: '0 1rem' }}>{error}</div>}
                    {profiles.length === 0 ? (
                        <div className="empty-state" style={{ padding: '2rem' }}>
                            <div className="empty-state-icon">👤</div>
                            <div className="empty-state-text">No members yet.</div>
                        </div>
                    ) : (
                        profiles.map(p => (
                            <div
                                key={p.member_id}
                                className={`member-list-item${selectedProfile?.member_id === p.member_id ? ' selected' : ''}`}
                                onClick={() => handleSelect(p)}
                                style={{ margin: '0 0.5rem', display: 'flex', justifyContent: 'space-between' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: 0 }}>
                                    <div className="member-avatar">
                                        {(p.name || p.member_id).slice(0, 2).toUpperCase()}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {p.name || p.member_id}
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                            {p.member_id}
                                            {p.age ? ` · ${p.age} yrs` : ''}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    className="btn btn-danger btn-sm"
                                    style={{ flexShrink: 0 }}
                                    onClick={e => { e.stopPropagation(); handleDelete(p.member_id); }}
                                >
                                    Delete
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Edit / Create form */}
            <div className="card">
                <div className="card-header">
                    <span className="card-title">
                        {isEditing ? `Edit · ${selectedProfile.member_id}` : 'Create New Profile'}
                    </span>
                    {isEditing && (
                        <button className="btn btn-ghost btn-sm" onClick={clearForm}>✕ Cancel</button>
                    )}
                </div>
                <div className="card-body flex-col gap-2">
                    {/* Basic info */}
                    <div>
                        <div className="section-label">Basic Information</div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">Name</label>
                                <input className="form-control" value={name} onChange={e => setName(e.target.value)} placeholder="Full name" />
                            </div>
                            <div className="form-grid form-grid-2">
                                <div className="form-group">
                                    <label className="form-label">Age</label>
                                    <input className="form-control" type="number" min={0} value={age} onChange={e => setAge(e.target.value ? Number(e.target.value) : '')} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Weight (kg)</label>
                                    <input className="form-control" type="number" min={0} value={weight} onChange={e => setWeight(e.target.value ? Number(e.target.value) : '')} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Medical History / Notes</label>
                                <textarea className="form-control" value={history} onChange={e => setHistory(e.target.value)} rows={3} placeholder="e.g. heart condition, medications…" />
                            </div>
                        </div>
                    </div>

                    {/* Thresholds (edit only) */}
                    {isEditing && (
                        <div>
                            <div className="section-label">Personalized Alert Thresholds</div>
                            <div className="form-grid form-grid-2">
                                <div className="form-group">
                                    <label className="form-label">Max Heart Rate (bpm)</label>
                                    <input className="form-control" type="number" min={60} max={220} value={hrMax} onChange={e => setHrMax(e.target.value ? Number(e.target.value) : '')} placeholder="e.g. 170" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Min Heart Rate (bpm)</label>
                                    <input className="form-control" type="number" min={30} max={80} value={hrMin} onChange={e => setHrMin(e.target.value ? Number(e.target.value) : '')} placeholder="e.g. 40" />
                                </div>
                            </div>
                        </div>
                    )}

                    {isEditing ? (
                        <button className="btn btn-primary" onClick={handleUpdate}>Save Changes</button>
                    ) : (
                        <button className="btn btn-success" onClick={handleCreate}>Create Member</button>
                    )}

                    {status && <div className="status-msg success">{status}</div>}
                    {error && <div className="status-msg error">{error}</div>}
                </div>
            </div>
        </div>
    );
};

export default MemberProfiles;
