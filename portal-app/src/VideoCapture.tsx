import { useCallback, useEffect, useRef, useState } from 'react';
import * as portalApi from './services/portalApi';
import { type VideoAnalysisResult } from './services/portalApi';

type RecordingState = 'idle' | 'camera-starting' | 'ready' | 'recording' | 'recorded';

const VERDICT_LABEL: Record<VideoAnalysisResult['verdict'], string> = {
    CRITICAL: 'Critical Safety Incident Detected',
    WARNING: 'Potential Safety Concern Detected',
    NO_INCIDENT: 'No Incident Detected',
    UNAVAILABLE: 'Analysis Unavailable',
};

const VERDICT_STYLE: Record<VideoAnalysisResult['verdict'], React.CSSProperties> = {
    CRITICAL: { borderLeftColor: 'var(--critical)', background: '#fef2f2' },
    WARNING: { borderLeftColor: 'var(--warning)', background: '#fffbeb' },
    NO_INCIDENT: { borderLeftColor: 'var(--success)', background: '#f0fdf4' },
    UNAVAILABLE: { borderLeftColor: 'var(--text-muted)', background: 'var(--bg)' },
};

const VERDICT_TEXT_COLOR: Record<VideoAnalysisResult['verdict'], string> = {
    CRITICAL: 'var(--critical)',
    WARNING: '#b45309',
    NO_INCIDENT: 'var(--success)',
    UNAVAILABLE: 'var(--text-muted)',
};

function VerdictCard({ result }: { result: VideoAnalysisResult }) {
    const style = VERDICT_STYLE[result.verdict];
    const color = VERDICT_TEXT_COLOR[result.verdict];
    const label = VERDICT_LABEL[result.verdict];

    return (
        <div
            className="card"
            style={{
                borderLeft: `4px solid`,
                ...style,
                padding: '1rem 1.25rem',
                marginTop: '1.25rem',
            }}
        >
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color, marginBottom: '0.25rem' }}>
                {label}
            </div>
            {result.verdict !== 'UNAVAILABLE' && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Gemini response: <em>{result.detail}</em>
                </div>
            )}
            {result.verdict === 'UNAVAILABLE' && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {result.detail}
                </div>
            )}
            {(result.verdict === 'CRITICAL' || result.verdict === 'WARNING') && (
                <div style={{ fontSize: '0.8rem', marginTop: '0.4rem', color: 'var(--text-muted)' }}>
                    Alert has been raised and is visible in the{' '}
                    <a href="/alerts" style={{ color: 'var(--primary)' }}>
                        Alerts Dashboard
                    </a>
                    .
                </div>
            )}
        </div>
    );
}

const VideoCapture = () => {
    const [recordingState, setRecordingState] = useState<RecordingState>('idle');
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<VideoAnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [zoneId, setZoneId] = useState('demo-zone');

    const liveVideoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    // Cleanup object URLs on unmount
    useEffect(() => {
        return () => {
            if (recordedUrl) URL.revokeObjectURL(recordedUrl);
            streamRef.current?.getTracks().forEach(t => t.stop());
        };
    }, [recordedUrl]);

    const startCamera = useCallback(async () => {
        setError(null);
        setResult(null);
        setRecordingState('camera-starting');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            streamRef.current = stream;
            setRecordingState('ready');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not access camera');
            setRecordingState('idle');
        }
    }, []);

    // Attach the live stream once the video element is in the DOM.
    // liveVideoRef is only populated after the element renders (isCameraOn → true),
    // so we cannot set srcObject in startCamera directly.
    useEffect(() => {
        if (liveVideoRef.current && streamRef.current) {
            liveVideoRef.current.srcObject = streamRef.current;
        }
    }, [recordingState]);

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        if (liveVideoRef.current) liveVideoRef.current.srcObject = null;
        setRecordingState('idle');
        setResult(null);
        setRecordedBlob(null);
        if (recordedUrl) {
            URL.revokeObjectURL(recordedUrl);
            setRecordedUrl(null);
        }
    }, [recordedUrl]);

    const startRecording = useCallback(() => {
        const stream = streamRef.current;
        if (!stream) return;

        chunksRef.current = [];
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
            ? 'video/webm;codecs=vp9'
            : 'video/webm';
        const mr = new MediaRecorder(stream, { mimeType });

        mr.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mr.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: mimeType });
            const url = URL.createObjectURL(blob);
            setRecordedBlob(blob);
            setRecordedUrl(url);
            setRecordingState('recorded');
        };

        mediaRecorderRef.current = mr;
        mr.start();
        setRecordingState('recording');
    }, []);

    const stopRecording = useCallback(() => {
        mediaRecorderRef.current?.stop();
        // State transition handled in mr.onstop
    }, []);

    const discardRecording = useCallback(() => {
        if (recordedUrl) URL.revokeObjectURL(recordedUrl);
        setRecordedBlob(null);
        setRecordedUrl(null);
        setResult(null);
        setRecordingState('ready');
    }, [recordedUrl]);

    const analyzeClip = useCallback(async () => {
        if (!recordedBlob) return;
        setAnalyzing(true);
        setError(null);
        setResult(null);
        try {
            const res = await portalApi.uploadVideoForAnalysis(recordedBlob, zoneId || undefined);
            setResult(res);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Analysis request failed');
        } finally {
            setAnalyzing(false);
        }
    }, [recordedBlob, zoneId]);

    const isRecording = recordingState === 'recording';
    const isReady = recordingState === 'ready';
    const isCameraOn = recordingState === 'ready' || recordingState === 'recording' || recordingState === 'recorded';
    const isRecorded = recordingState === 'recorded';

    return (
        <div style={{ maxWidth: 720 }}>
            {/* Instructions card */}
            <div className="card" style={{ marginBottom: '1.25rem' }}>
                <div className="card-header">
                    <span className="card-title">UC1 — Critical Safety Event Detection Demo</span>
                </div>
                <div className="card-body" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                    Record a short clip from your device camera, then click <strong>Analyze</strong> to send it to Gemini
                    for safety analysis. If a safety incident is detected, an alert is automatically raised in the system.
                </div>
            </div>

            {/* Zone ID input */}
            <div className="card" style={{ marginBottom: '1.25rem' }}>
                <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>
                        Gym Zone
                    </label>
                    <input
                        className="form-input"
                        type="text"
                        value={zoneId}
                        onChange={e => setZoneId(e.target.value)}
                        placeholder="e.g. free-weight-zone"
                        style={{ maxWidth: 240 }}
                        disabled={isRecording}
                    />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Attached to the saved video clip
                    </span>
                </div>
            </div>

            {/* Camera / recording panel */}
            <div className="card">
                <div className="card-header">
                    <span className="card-title">Camera</span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {!isCameraOn && (
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={startCamera}
                                disabled={recordingState === 'camera-starting'}
                            >
                                {recordingState === 'camera-starting' ? 'Starting…' : 'Start Camera'}
                            </button>
                        )}
                        {isCameraOn && !isRecording && !isRecorded && (
                            <button className="btn btn-danger btn-sm" onClick={startRecording}>
                                ● Record
                            </button>
                        )}
                        {isRecording && (
                            <button className="btn btn-warning btn-sm" onClick={stopRecording}>
                                ■ Stop
                            </button>
                        )}
                        {isCameraOn && (
                            <button className="btn btn-ghost btn-sm" onClick={stopCamera}>
                                Close Camera
                            </button>
                        )}
                    </div>
                </div>

                <div className="card-body">
                    {/* Live preview */}
                    {isCameraOn && (
                        <div style={{ position: 'relative', marginBottom: isRecorded ? '1rem' : 0 }}>
                            <video
                                ref={liveVideoRef}
                                autoPlay
                                muted
                                playsInline
                                style={{
                                    width: '100%',
                                    borderRadius: 'var(--radius-sm)',
                                    background: '#000',
                                    display: 'block',
                                }}
                            />
                            {isRecording && (
                                <span
                                    style={{
                                        position: 'absolute',
                                        top: 10,
                                        left: 12,
                                        background: 'var(--critical)',
                                        color: 'white',
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        padding: '2px 8px',
                                        borderRadius: 4,
                                    }}
                                >
                                    ● REC
                                </span>
                            )}
                        </div>
                    )}

                    {/* No camera placeholder */}
                    {!isCameraOn && (
                        <div
                            style={{
                                height: 200,
                                background: 'var(--bg)',
                                borderRadius: 'var(--radius-sm)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--text-muted)',
                                fontSize: '0.85rem',
                                border: '1px dashed var(--border)',
                            }}
                        >
                            Camera off — click <strong style={{ margin: '0 4px' }}>Start Camera</strong> to begin
                        </div>
                    )}

                    {/* Recorded clip preview + analyze */}
                    {isRecorded && recordedUrl && (
                        <div style={{ marginTop: '1rem' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                                RECORDED CLIP
                            </div>
                            <video
                                src={recordedUrl}
                                controls
                                style={{
                                    width: '100%',
                                    borderRadius: 'var(--radius-sm)',
                                    background: '#000',
                                    display: 'block',
                                    marginBottom: '0.75rem',
                                }}
                            />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    className="btn btn-primary"
                                    onClick={analyzeClip}
                                    disabled={analyzing}
                                >
                                    {analyzing ? 'Analyzing…' : 'Analyze for Safety Incidents'}
                                </button>
                                <button
                                    className="btn btn-ghost"
                                    onClick={discardRecording}
                                    disabled={analyzing}
                                >
                                    Discard & Re-record
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Error */}
            {error && (
                <div
                    className="card"
                    style={{
                        marginTop: '1rem',
                        borderLeft: '4px solid var(--critical)',
                        background: '#fef2f2',
                        padding: '0.75rem 1rem',
                        fontSize: '0.85rem',
                        color: 'var(--critical)',
                    }}
                >
                    {error}
                </div>
            )}

            {/* Analysis result */}
            {result && <VerdictCard result={result} />}
        </div>
    );
};

export default VideoCapture;
