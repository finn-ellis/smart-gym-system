import React, { useEffect, useState } from 'react';
import * as portalApi from './services/portalApi';
import { MemberProfile } from './types';

const MemberProfiles = () => {
    const [profiles, setProfiles] = useState<MemberProfile[]>([]);
    const [selectedProfile, setSelectedProfile] = useState<MemberProfile | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [age, setAge] = useState<number | ''>('');
    const [weight, setWeight] = useState<number | ''>('');
    const [history, setHistory] = useState('');

    const loadProfiles = async () => {
        try {
            const { member_ids } = await portalApi.listMembers();
            const loaded = await Promise.all(member_ids.map(id => portalApi.getMemberProfile(id)));
            setProfiles(loaded);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load profiles');
        }
    };

    useEffect(() => {
        loadProfiles();
    }, []);

    const handleSelect = (profile: MemberProfile) => {
        setSelectedProfile(profile);
        setName(profile.name || '');
        setAge(profile.age || '');
        setWeight(profile.weight_kg || '');
        setHistory(profile.medical_history || '');
        setError(null);
    };

    const handleCreate = async () => {
        try {
            const newMemberId = `member-${Date.now().toString().slice(-4)}`;
            await portalApi.registerMember({
                member_id: newMemberId,
                name,
                age: Number(age) || 0,
                weight_kg: Number(weight) || 0,
                medical_history: history
            });
            await loadProfiles();
            // Optionally auto-select the newly created member next time
            setSelectedProfile({ member_id: newMemberId, name, age: Number(age) || 0, weight_kg: Number(weight) || 0, medical_history: history } as MemberProfile);
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Create failed');
        }
    };

    const handleUpdate = async () => {
        if (!selectedProfile) return;
        try {
            await portalApi.updateMemberProfile(selectedProfile.member_id, {
                name,
                age: Number(age) || 0,
                weight_kg: Number(weight) || 0,
                medical_history: history
            });
            await loadProfiles();
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Update failed');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await portalApi.removeMember(id);
            if (selectedProfile?.member_id === id) {
                setSelectedProfile(null);
                setName('');
                setAge('');
                setWeight('');
                setHistory('');
            }
            await loadProfiles();
            setError(null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Delete failed');
        }
    };

    return (
        <div style={{ display: 'flex', gap: '2rem', maxWidth: 800 }}>
            <div style={{ flex: 1 }}>
                <h1>Member Profiles</h1>
                {error && <p style={{ color: '#d9534f', fontWeight: 'bold' }}>{error}</p>}

                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {profiles.map(p => (
                        <li key={p.member_id} style={{ padding: '0.5rem', border: '1px solid #ccc', margin: '0.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span
                                style={{ cursor: 'pointer', flex: 1, fontWeight: selectedProfile?.member_id === p.member_id ? 'bold' : 'normal', color: '#007bff' }}
                                onClick={() => handleSelect(p)}
                            >
                                {p.member_id} {p.name ? `- ${p.name}` : ''}
                            </span>
                            <button onClick={() => handleDelete(p.member_id)} style={{ color: 'white', backgroundColor: '#d9534f', border: 'none', padding: '0.25rem 0.5rem', borderRadius: 4, cursor: 'pointer' }}>
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
                <button
                    onClick={() => { setSelectedProfile(null); setName(''); setAge(''); setWeight(''); setHistory(''); }}
                    style={{ padding: '0.5rem', cursor: 'pointer' }}
                >
                    Clear Selection / Add New Member
                </button>
            </div>

            <div style={{ flex: 1, padding: '1rem', border: '1px solid #ccc', borderRadius: 6, alignSelf: 'flex-start' }}>
                <h2>{selectedProfile ? `Edit: ${selectedProfile.member_id}` : 'Create New Profile'}</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <label style={{ display: 'flex', flexDirection: 'column' }}>
                        Name:
                        <input value={name} onChange={e => setName(e.target.value)} style={{ padding: '0.25rem' }} />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column' }}>
                        Age:
                        <input type="number" min={0} value={age} onChange={e => setAge(e.target.value ? Number(e.target.value) : '')} style={{ padding: '0.25rem' }} />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column' }}>
                        Weight (kg):
                        <input type="number" min={0} value={weight} onChange={e => setWeight(e.target.value ? Number(e.target.value) : '')} style={{ padding: '0.25rem' }} />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column' }}>
                        Medical History:
                        <textarea value={history} onChange={e => setHistory(e.target.value)} rows={4} style={{ padding: '0.25rem' }} />
                    </label>

                    {selectedProfile ? (
                        <button onClick={handleUpdate} style={{ padding: '0.5rem', backgroundColor: '#0275d8', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Update Member</button>
                    ) : (
                        <button onClick={handleCreate} style={{ padding: '0.5rem', backgroundColor: '#5cb85c', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Create Member</button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MemberProfiles;
