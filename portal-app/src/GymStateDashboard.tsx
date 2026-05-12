import { useEffect, useState } from 'react';
import * as portalApi from './services/portalApi';
import { GymState } from './types';

function formatTs(ts: number): string {
    if (!ts) return '—';
    return new Date(ts * 1000).toLocaleString();
}

const GymStateDashboard = () => {
    const [state, setState] = useState<GymState | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadState = async () => {
        setLoading(true);
        setError(null);
        try {
            const states = await portalApi.getGymStates();
            setState(states.length > 0 ? states[states.length - 1] : null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load gym state');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadState(); }, []);

    const occupancyEntries = state ? Object.entries(state.occupancy_counts) : [];
    const totalOccupancy = occupancyEntries.reduce((sum, [, v]) => sum + v, 0);
    const activeAlertCount = state?.active_alert_ids?.length ?? 0;

    return (
        <div style={{ maxWidth: 900 }}>
            <div className="flex gap-1" style={{ justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
                <button className="btn btn-ghost btn-sm" onClick={loadState} disabled={loading}>
                    ↻ Refresh
                </button>
            </div>

            {error && <div className="status-msg error">{error}</div>}

            {loading ? (
                <div className="empty-state"><div className="empty-state-text">Loading gym state…</div></div>
            ) : !state ? (
                <div className="empty-state">
                    <div className="empty-state-icon">⬡</div>
                    <div className="empty-state-text">No gym state data available yet.</div>
                </div>
            ) : (
                <>
                    {/* KPI row */}
                    <div className="grid-3 mb-3">
                        <div className="metric-card">
                            <div className="metric-label">Total Occupancy</div>
                            <div className="metric-value">
                                {totalOccupancy}
                                <span className="metric-unit"> members</span>
                            </div>
                        </div>
                        <div className="metric-card" style={activeAlertCount > 0 ? { borderLeftColor: 'var(--warning)', borderLeftWidth: 4 } : {}}>
                            <div className="metric-label">Active Alerts</div>
                            <div className="metric-value" style={activeAlertCount > 0 ? { color: 'var(--warning)' } : {}}>
                                {activeAlertCount}
                                <span className="metric-unit"> open</span>
                            </div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-label">Last Updated</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '0.25rem', color: 'var(--text)' }}>
                                {formatTs(state.timestamp)}
                            </div>
                        </div>
                    </div>

                    {/* Zone occupancy */}
                    {occupancyEntries.length > 0 && (
                        <div className="card mb-3">
                            <div className="card-header">
                                <span className="card-title">Zone Occupancy</span>
                            </div>
                            <div className="card-body">
                                <div className="table-wrap">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Zone</th>
                                                <th>Members</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {occupancyEntries.map(([zone, count]) => (
                                                <tr key={zone}>
                                                    <td>{zone}</td>
                                                    <td>{count}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Active alert IDs */}
                    {activeAlertCount > 0 && (
                        <div className="card">
                            <div className="card-header">
                                <span className="card-title">Active Alert IDs</span>
                                <span className="badge badge-warning">{activeAlertCount}</span>
                            </div>
                            <div className="card-body">
                                <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                                    {state.active_alert_ids.map(id => (
                                        <span key={id} className="badge badge-muted">{id}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default GymStateDashboard;

