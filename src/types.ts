export type UserRole = 'citizen' | 'officer';

export interface User {
  id: string;
  emailOrPhone: string;
  fullName: string;
  role: UserRole;
  state?: string;      // Required for Government Employees
  district?: string;   // Required for Government Employees
  coinBalance: number;
  createdAt: string;
  username?: string;
  avatarUrl?: string;
}

export type ComplaintStatus = 'pending' | 'resolved';

export interface Complaint {
  id: string;
  reporterId: string;
  reporterName: string;
  title: string;
  description: string;
  imageUrl: string; // Live photo URL
  latitude: number;
  longitude: number;
  address: string;
  state: string;
  district: string;
  status: ComplaintStatus;
  verificationsCount: number; // Max 10 verifications
  verifiedUserIds: string[];  // Users who have verified this issue
  resolvedBy?: string;        // Officer ID
  resolvedPhotoUrl?: string;  // Live proof photo URL from exact location
  resolvedAt?: string;
  createdAt: string;
}

export interface VerificationLog {
  id: string;
  complaintId: string;
  verifierId: string;
  verifierName: string;
  verifierLatitude: number;
  verifierLongitude: number;
  selfieUrl: string;
  isWithinGeofence: boolean;
  createdAt: string;
}

export interface CoinTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'earn_report' | 'earn_verify' | 'challenge_penalty';
  complaintId: string;
  description: string;
  createdAt: string;
}

export interface Message {
  id: string;
  chatRoomId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  createdAt: string;
}

export interface ChatRoom {
  id: string;
  complaintId: string;
  complaintTitle: string;
  citizenId: string;
  citizenName: string;
  lastMessage?: string;
  lastMessageAt?: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  type: 'auth' | 'database' | 'geofence' | 'rewards' | 'challenge';
  message: string;
  details?: any;
}
