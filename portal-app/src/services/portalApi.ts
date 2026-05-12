import {
    AlertId,
    AlertInfo,
    GymState,
    MemberId,
    MemberProfile,
    Report,
    ReportId,
    ReportInfo,
    VideoClip,
    VideoClipId,
    WristbandId,
} from '../types';

const API_BASE_URL = '/api'; // Assuming a proxy setup or similar base URL

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    return response.json();
}

/**
 * GET /alerts
 */
export async function getAlerts(): Promise<AlertInfo[]> {
    return request<AlertInfo[]>('/alerts');
}

/**
 * GET /alerts/<alert_id>
 */
export async function viewAlert(alertId: AlertId): Promise<AlertInfo> {
    return request<AlertInfo>(`/alerts/${alertId}`);
}

/**
 * POST /alerts/<alert_id>/dismiss
 */
export async function dismissAlert(alertId: AlertId): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>(`/alerts/${alertId}/dismiss`, {
        method: 'POST',
    });
}

/**
 * GET /reports
 */
export async function getReports(): Promise<ReportInfo[]> {
    return request<ReportInfo[]>('/reports');
}

/**
 * GET /reports/<report_id>
 */
export async function viewReport(reportId: ReportId): Promise<Report> {
    return request<Report>(`/reports/${reportId}`);
}

/**
 * GET /gym_states
 */
export async function getGymStates(): Promise<GymState[]> {
    return request<GymState[]>('/gym_states');
}

/**
 * GET /wristbands/available
 */
export async function listAvailableWristbands(): Promise<Array<{ board_id: number; name: string; description: string }>> {
    return request<Array<{ board_id: number; name: string; description: string }>>('/wristbands/available');
}

/**
 * GET /members
 */
export async function listMembers(): Promise<{ member_ids: MemberId[] }> {
    return request<{ member_ids: MemberId[] }>('/members');
}

/**
 * POST /members
 */
export async function registerMember(profileData: Partial<MemberProfile>): Promise<{ ok: boolean; profile: MemberProfile }> {
    return request<{ ok: boolean; profile: MemberProfile }>('/members', {
        method: 'POST',
        body: JSON.stringify(profileData),
    });
}

/**
 * GET /members/<member_id>
 */
export async function getMemberProfile(memberId: MemberId): Promise<MemberProfile> {
    return request<MemberProfile>(`/members/${memberId}`);
}

/**
 * PUT/PATCH /members/<member_id>
 */
export async function updateMemberProfile(
    memberId: MemberId,
    profileData: Partial<MemberProfile>,
): Promise<{ ok: boolean; profile: MemberProfile }> {
    return request<{ ok: boolean; profile: MemberProfile }>(`/members/${memberId}`, {
        method: 'PATCH',
        body: JSON.stringify(profileData),
    });
}

/**
 * DELETE /members/<member_id>
 */
export async function removeMember(memberId: MemberId): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>(`/members/${memberId}`, {
        method: 'DELETE',
    });
}

/**
 * GET /videos/<clip_id>
 */
export async function getVideoClip(clipId: VideoClipId): Promise<VideoClip> {
    return request<VideoClip>(`/videos/${clipId}`);
}

/**
 * POST /wristbands/assign
 * Expects wristband_id and member_id in payload.
 * Optional ip_address and serial_number for EmotiBit connectivity.
 */
export async function assignWristband(
    wristbandId: WristbandId,
    memberId: MemberId,
    ipAddress?: string,
    serialNumber?: string,
): Promise<{ ok: boolean; wristband_id: WristbandId; member_id: MemberId }> {
    return request<{ ok: boolean; wristband_id: WristbandId; member_id: MemberId }>('/wristbands/assign', {
        method: 'POST',
        body: JSON.stringify({
            wristband_id: wristbandId,
            member_id: memberId,
            ip_address: ipAddress,
            serial_number: serialNumber,
        }),
    });
}

/**
 * POST /wristbands/return
 * UC3 deassignment: stop biometric monitoring for a returned wristband.
 */
export async function onWristbandReturned(
    wristbandId: WristbandId,
): Promise<{ ok: boolean; wristband_id: WristbandId }> {
    return request<{ ok: boolean; wristband_id: WristbandId }>('/wristbands/return', {
        method: 'POST',
        body: JSON.stringify({ wristband_id: wristbandId }),
    });
}
