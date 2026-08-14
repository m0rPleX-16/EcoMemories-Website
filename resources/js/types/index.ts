export interface Device {
    id: number;
    name: string;
    device_code: string;
    type: string;
    status: string;
    last_seen_at: string | null;
    created_at: string;
}

export interface Session {
    id: number;
    session_code: string;
    user_id: number | null;
    status: 'active' | 'completed' | 'expired';
    created_at: string;
    expires_at: string;
    updated_at: string;
    deposits: Deposit[];
    rewards: Reward[];
    photo_sessions: PhotoSession[];
    deposits_count?: number;
    valid_deposits_count?: number;
    available_credits?: number;
}

export interface Deposit {
    id: number;
    session_id: number;
    device_id: number;
    weight: number | null;
    type: string | null;
    status: 'pending' | 'valid' | 'invalid' | 'rejected';
    event_id: string;
    created_at: string;
}

export interface Reward {
    id: number;
    session_id: number;
    type: string;
    amount: number;
    status: 'available' | 'consumed' | 'expired';
    created_at: string;
}

export interface PhotoSession {
    id: number;
    session_id: number;
    reward_id: number;
    status: 'active' | 'captured' | 'completed' | 'cancelled';
    photo: Photo | null;
    photo_id: number | null;
    created_at: string;
    completed_at: string | null;
}

export interface Photo {
    id: number;
    photo_session_id: number;
    storage_path: string;
    public_url: string | null;
    reference_code: string;
    created_at: string;
}

export interface Transaction {
    id: number;
    session_id: number;
    type: string;
    reference_id: number | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
}

// API Response types
export interface SessionResponse {
    success: boolean;
    session: Session;
}

export interface DepositResponse {
    success: boolean;
    deposit: Deposit;
    reward_earned: boolean;
    session: {
        deposits: number;
        required: number;
        credits: number;
    };
}

export interface PhotoSessionResponse {
    success: boolean;
    photo_session: PhotoSession;
}

export interface PhotoUploadResponse {
    success: boolean;
    photo: Photo;
    photo_session: PhotoSession;
}
