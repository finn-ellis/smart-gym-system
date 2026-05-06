import { useState } from 'react';
import * as portalApi from './services/portalApi';

const WristbandManagement = () => {
    const [memberId, setMemberId] = useState('member-001');
    const [wristbandId, setWristbandId] = useState('wb-demo-001');
    const [maxHeartRateBpm, setMaxHeartRateBpm] = useState('170');
    const [notes, setNotes] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function assignSession() {
        setError(null);
        setStatus('Saving profile…');
        try {
            const hr = Number.parseFloat(maxHeartRateBpm);
            await portalApi.updateMemberProfile(memberId.trim(), {
                ...(displayName.trim() ? { display_name: displayName.trim() } : {}),
                ...(notes.trim() ? { notes: notes.trim() } : {}),
                ...(!Number.isNaN(hr) ? { thresholds: { max_heart_rate_bpm: hr } } : {}),
            });
            setStatus('Assigning wristband…');
            await portalApi.assignWristband(wristbandId.trim(), memberId.trim());
            setStatus('Assign flow complete (UC3 steps 2–5: profile update, assign, route to pairWristband).');
        } catch (e) {
            setStatus(null);
            setError(e instanceof Error ? e.message : 'Request failed');
        }
    }

    return (
        <div style={{ maxWidth: 560 }}>
            <h1>Wristband Management</h1>
            <p>
                UC3 steps 2–5 · Staff use wristband assigning: optional <code>updateMemberProfile</code>, then{' '}
                <code>assignWristband</code>; the portal handler calls <code>pairWristband</code> (no monitoring /
                hardware ingestion in this slice).
            </p>
            <section style={{ display: 'grid', gap: '0.75rem', marginTop: '1.25rem' }}>
                <label>
                    Member ID
                    <input
                        type="text"
                        value={memberId}
                        onChange={(e) => setMemberId(e.target.value)}
                        style={{ width: '100%', display: 'block', marginTop: 4 }}
                    />
                </label>
                <label>
                    Wristband ID
                    <input
                        type="text"
                        value={wristbandId}
                        onChange={(e) => setWristbandId(e.target.value)}
                        style={{ width: '100%', display: 'block', marginTop: 4 }}
                    />
                </label>
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
                </div>
            </section>
            {status ? <p style={{ marginTop: '1rem', color: '#0a5' }}>{status}</p> : null}
            {error ? <p style={{ marginTop: '1rem', color: '#a00' }}>{error}</p> : null}
        </div>
    );
};

export default WristbandManagement;
