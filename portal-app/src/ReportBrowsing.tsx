import { useEffect, useState } from 'react';
import * as portalApi from './services/portalApi';
import { Report, ReportInfo, ReportType } from './types';

function formatTs(ts: number): string {
    if (!ts) return '—';
    return new Date(ts * 1000).toLocaleString();
}

function reportTypeClass(type?: ReportType): string {
    switch (type) {
        case ReportType.DAILY: return 'badge-info';
        case ReportType.WEEKLY: return 'badge-success';
        case ReportType.MONTHLY: return 'badge-warning';
        default: return 'badge-muted';
    }
}

const REPORT_TYPES: Array<ReportType | 'all'> = ['all', ReportType.HOURLY, ReportType.DAILY, ReportType.WEEKLY, ReportType.MONTHLY];

const ReportBrowsing = () => {
    const [reports, setReports] = useState<ReportInfo[]>([]);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [typeFilter, setTypeFilter] = useState<ReportType | 'all'>('all');
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadReports = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await portalApi.getReports();
            setReports(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadReports(); }, []);

    const handleSelect = async (reportId: string) => {
        if (selectedReport?.report_id === reportId) {
            setSelectedReport(null);
            return;
        }
        setDetailLoading(true);
        try {
            const detail = await portalApi.viewReport(reportId);
            setSelectedReport(detail);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load report');
        } finally {
            setDetailLoading(false);
        }
    };

    const filtered = typeFilter === 'all'
        ? reports
        : reports.filter(r => r.report_type === typeFilter);

    return (
        <div style={{ maxWidth: 960 }}>
            {/* Filter + refresh */}
            <div className="flex gap-1" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div className="filter-bar" style={{ marginBottom: 0 }}>
                    {REPORT_TYPES.map(t => (
                        <button
                            key={t}
                            className={`filter-chip${typeFilter === t ? ' active' : ''}`}
                            onClick={() => setTypeFilter(t)}
                        >
                            {t === 'all' ? `All (${reports.length})` : t}
                        </button>
                    ))}
                </div>
                <button className="btn btn-ghost btn-sm" onClick={loadReports} disabled={loading}>
                    ↻ Refresh
                </button>
            </div>

            {error && <div className="status-msg error">{error}</div>}

            {loading ? (
                <div className="empty-state"><div className="empty-state-text">Loading reports…</div></div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📄</div>
                    <div className="empty-state-text">No reports available for this filter.</div>
                </div>
            ) : (
                <div className="card">
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Type</th>
                                    <th>Generated</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(r => (
                                    <>
                                        <tr key={r.report_id} style={{ cursor: 'pointer' }} onClick={() => handleSelect(r.report_id)}>
                                            <td>
                                                <span style={{ fontWeight: 500 }}>{r.title || r.report_id}</span>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.report_id}</div>
                                            </td>
                                            <td>
                                                <span className={`badge ${reportTypeClass(r.report_type)}`}>
                                                    {r.report_type ?? 'Unknown'}
                                                </span>
                                            </td>
                                            <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                                {formatTs(r.created_at)}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button className="btn btn-ghost btn-sm">
                                                    {selectedReport?.report_id === r.report_id ? 'Close ▲' : 'View ▼'}
                                                </button>
                                            </td>
                                        </tr>
                                        {selectedReport?.report_id === r.report_id && (
                                            <tr key={`${r.report_id}-detail`}>
                                                <td colSpan={4} style={{ padding: 0 }}>
                                                    <div style={{ background: 'var(--bg)', padding: '1.25rem', borderTop: '1px solid var(--border)' }}>
                                                        {detailLoading ? (
                                                            <div className="text-muted">Loading…</div>
                                                        ) : (
                                                            <>
                                                                <div className="section-label" style={{ marginBottom: '0.75rem' }}>
                                                                    Report Contents
                                                                </div>
                                                                {Object.keys(selectedReport.data ?? {}).length === 0 ? (
                                                                    <div className="text-muted">No data in this report.</div>
                                                                ) : (
                                                                    <pre style={{
                                                                        background: 'var(--surface)',
                                                                        border: '1px solid var(--border)',
                                                                        borderRadius: 'var(--radius-sm)',
                                                                        padding: '1rem',
                                                                        fontSize: '0.78rem',
                                                                        overflow: 'auto',
                                                                        maxHeight: 320,
                                                                        margin: 0,
                                                                        color: 'var(--text)',
                                                                    }}>
                                                                        {JSON.stringify(selectedReport.data, null, 2)}
                                                                    </pre>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportBrowsing;

