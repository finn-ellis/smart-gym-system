import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import * as portalApi from './services/portalApi';
import { AlertInfo, AlertSeverity } from './types';

type Filter = 'all' | 'critical' | 'warning' | 'info' | 'dismissed';

function severityClass(severity: AlertSeverity): string {
    switch (severity) {
        case AlertSeverity.CRITICAL: return 'critical';
        case AlertSeverity.WARNING: return 'warning';
        default: return 'info';
    }
}

function SeverityBadge({ severity }: { severity: AlertSeverity }) {
    const cls = severityClass(severity);
    return <span className={`badge badge-${cls}`}>{severity}</span>;
}

function formatTs(ts: number): string {
    if (!ts) return '—';
    return new Date(ts * 1000).toLocaleString();
}

const AlertsDashboard = () => {
    const [alerts, setAlerts] = useState<AlertInfo[]>([]);
    const [filter, setFilter] = useState<Filter>('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadAlerts = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await portalApi.getAlerts();
            setAlerts(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load alerts');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAlerts();

        const socket: Socket = io('/', { path: '/socket.io' });
        socket.on('alertCreated', (alert: AlertInfo) => {
            setAlerts(prev => [alert, ...prev.filter(a => a.alert_id !== alert.alert_id)]);
        });
        return () => { socket.disconnect(); };
    }, []);

    const handleDismiss = async (alertId: string) => {
        try {
            await portalApi.dismissAlert(alertId);
            setAlerts(prev => prev.map(a =>
                a.alert_id === alertId ? { ...a, dismissed: true } : a
            ));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Dismiss failed');
        }
    };

    const filtered = alerts.filter(a => {
        if (filter === 'all') return !a.dismissed;
        if (filter === 'dismissed') return a.dismissed;
        if (filter === 'critical') return !a.dismissed && a.severity === AlertSeverity.CRITICAL;
        if (filter === 'warning') return !a.dismissed && a.severity === AlertSeverity.WARNING;
        if (filter === 'info') return !a.dismissed && a.severity === AlertSeverity.INFORMATIONAL;
        return true;
    });

    const criticalCount = alerts.filter(a => !a.dismissed && a.severity === AlertSeverity.CRITICAL).length;
    const warningCount = alerts.filter(a => !a.dismissed && a.severity === AlertSeverity.WARNING).length;

    const FILTERS: { key: Filter; label: string }[] = [
        { key: 'all', label: `Active (${alerts.filter(a => !a.dismissed).length})` },
        { key: 'critical', label: `Critical (${criticalCount})` },
        { key: 'warning', label: `Warning (${warningCount})` },
        { key: 'info', label: 'Informational' },
        { key: 'dismissed', label: 'Dismissed' },
    ];

    return (
        <div style={{ maxWidth: 800 }}>
            {/* Summary row */}
            {(criticalCount > 0 || warningCount > 0) && (
                <div className="flex gap-2 mb-3">
                    {criticalCount > 0 && (
                        <div className="metric-card flex gap-1" style={{ borderLeftColor: 'var(--critical)', borderLeftWidth: 4, flex: 1 }}>
                            <div>
                                <div className="metric-label">Critical</div>
                                <div className="metric-value" style={{ color: 'var(--critical)', fontSize: '1.5rem' }}>
                                    {criticalCount}
                                    <span className="metric-unit"> active</span>
                                </div>
                            </div>
                        </div>
                    )}
                    {warningCount > 0 && (
                        <div className="metric-card flex gap-1" style={{ borderLeftColor: 'var(--warning)', borderLeftWidth: 4, flex: 1 }}>
                            <div>
                                <div className="metric-label">Warning</div>
                                <div className="metric-value" style={{ color: 'var(--warning)', fontSize: '1.5rem' }}>
                                    {warningCount}
                                    <span className="metric-unit"> active</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Filter bar */}
            <div className="flex gap-1" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div className="filter-bar" style={{ marginBottom: 0 }}>
                    {FILTERS.map(({ key, label }) => (
                        <button
                            key={key}
                            className={`filter-chip${filter === key ? ' active' : ''}`}
                            onClick={() => setFilter(key)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <button className="btn btn-ghost btn-sm" onClick={loadAlerts} disabled={loading}>
                    ↻ Refresh
                </button>
            </div>

            {error && <div className="status-msg error">{error}</div>}

            {loading ? (
                <div className="empty-state">
                    <div className="empty-state-text">Loading alerts…</div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">✓</div>
                    <div className="empty-state-text">
                        {filter === 'all' ? 'No active alerts — facility looks good.' : 'No alerts in this category.'}
                    </div>
                </div>
            ) : (
                <div className="flex-col gap-1">
                    {filtered.map(alert => (
                        <div
                            key={alert.alert_id}
                            className={`alert-card ${severityClass(alert.severity)}${alert.dismissed ? ' dismissed' : ''}`}
                        >
                            <div className="alert-card-content">
                                <div className="alert-card-header">
                                    <SeverityBadge severity={alert.severity} />
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {alert.alert_id}
                                    </span>
                                </div>
                                <div className="alert-card-message">
                                    {alert.message || 'No message provided.'}
                                </div>
                                {(() => {
                                    const isVideo = alert.metadata?.type === 'video';
                                    const clipId = isVideo && alert.metadata?.clip_id ? String(alert.metadata.clip_id) : '';
                                    const aiDetail = isVideo && alert.metadata?.detail ? String(alert.metadata.detail) : '';
                                    const otherEntries = Object.entries(alert.metadata ?? {}).filter(
                                        ([k]) => !(isVideo && ['type', 'clip_id', 'detail'].includes(k))
                                    );
                                    return (
                                        <>
                                            {isVideo && clipId && (
                                                <div style={{ marginTop: '0.5rem' }}>
                                                    <video
                                                        src={`/api/videos/${clipId}/stream`}
                                                        controls
                                                        style={{ width: '100%', maxWidth: 400, borderRadius: 4 }}
                                                    />
                                                </div>
                                            )}
                                            {isVideo && aiDetail && (
                                                <div style={{ fontSize: '0.8rem', marginTop: '0.4rem', color: 'var(--text-muted)' }}>
                                                    AI analysis: <em>{aiDetail}</em>
                                                </div>
                                            )}
                                            {otherEntries.length > 0 && (
                                                <div className="alert-card-meta">
                                                    {otherEntries.map(([k, v]) => (
                                                        <span key={k} style={{ marginRight: '0.75rem' }}>
                                                            <strong>{k}:</strong> {String(v)}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                                <div className="alert-card-meta">{formatTs(alert.timestamp)}</div>
                            </div>
                            {!alert.dismissed && (
                                <button
                                    className="btn btn-ghost btn-sm"
                                    style={{ flexShrink: 0 }}
                                    onClick={() => handleDismiss(alert.alert_id)}
                                >
                                    Dismiss
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AlertsDashboard;

