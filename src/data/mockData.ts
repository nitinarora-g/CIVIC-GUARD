import { Complaint, ChatRoom, Message, User, SystemLog } from '../types';

export const DELHI_DISTRICTS = [
  'New Delhi',
  'Central Delhi',
  'South Delhi',
  'North Delhi',
  'West Delhi',
  'East Delhi'
];

export const STATES = [
  'Delhi',
  'Karnataka',
  'Maharashtra',
  'Tamil Nadu',
  'Telangana'
];

// Seed initial users
export const mockUsers: Record<string, User> = {
  'user_1': {
    id: 'user_1',
    emailOrPhone: '9876543210',
    fullName: 'Rahul Sharma',
    role: 'citizen',
    coinBalance: 350,
    createdAt: '2026-05-10T12:00:00Z',
    username: 'rahul_sharma',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
  },
  'user_2': {
    id: 'user_2',
    emailOrPhone: 'amit.kumar@gov.in',
    fullName: 'Amit Kumar (Assigned Officer)',
    role: 'officer',
    state: 'Delhi',
    district: 'New Delhi',
    coinBalance: 0,
    createdAt: '2026-04-01T09:00:00Z',
    username: 'officer_amit',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80'
  }
};

// Seed initial complaints with high-fidelity realistic SVG placeholder or image generation links
export const initialComplaints: Complaint[] = [
  {
    id: 'comp_101',
    reporterId: 'user_1',
    reporterName: 'Rahul Sharma',
    title: 'Severe Waterlogging & Broken Drainage',
    description: 'The sewage drain near Connaught Place Radial 3 is completely choked. Rainwater has pooled to almost 1.5 feet, making the road completely impassable and causing massive traffic jams. Immediate clearance of the main drain line is required.',
    imageUrl: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80', // realistic waterlogged flooded street
    latitude: 28.6304,
    longitude: 77.2177,
    address: 'Radial Road 3, Connaught Place, New Delhi - 110001',
    state: 'Delhi',
    district: 'New Delhi',
    status: 'pending',
    verificationsCount: 3,
    verifiedUserIds: ['user_test_1', 'user_test_2', 'user_test_3'],
    createdAt: '2026-06-25T08:15:00Z'
  },
  {
    id: 'comp_102',
    reporterId: 'user_3',
    reporterName: 'Priya Patel',
    title: 'Hazardous Open High-Voltage Wire',
    description: 'A critical high-voltage electric wire is hanging barely 4 feet off the pavement right in front of the Central Secretariat Park gate. Extremely dangerous for children and morning walkers, especially in damp weather.',
    imageUrl: 'https://images.unsplash.com/photo-1558486012-817176f84c6d?auto=format&fit=crop&w=600&q=80', // realistic hazardous hanging wires
    latitude: 28.6129,
    longitude: 77.2295,
    address: 'Kartavya Path Near Gate 2, Central Secretariat, New Delhi - 110001',
    state: 'Delhi',
    district: 'New Delhi',
    status: 'pending',
    verificationsCount: 0,
    verifiedUserIds: [],
    createdAt: '2026-06-25T14:30:00Z'
  },
  {
    id: 'comp_103',
    reporterId: 'user_4',
    reporterName: 'Vikram Singh',
    title: 'Illegal Garbage Dumping on Pavement',
    description: 'A massive pile of commercial garbage has been dumped illegally on the pedestrian walkway near Mandi House metro station. The stench is unbearable and it blocks the entire walking zone.',
    imageUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80', // realistic street garbage dump
    latitude: 28.6254,
    longitude: 77.2345,
    address: 'Mandi House Circle Lane, New Delhi - 110001',
    state: 'Delhi',
    district: 'New Delhi',
    status: 'pending',
    verificationsCount: 1,
    verifiedUserIds: ['user_test_4'],
    createdAt: '2026-06-26T01:10:00Z'
  },
  {
    id: 'comp_104',
    reporterId: 'user_1',
    reporterName: 'Rahul Sharma',
    title: 'Massive Potholes on Main Crossing',
    description: 'Huge structural pothole at the main traffic signal junction. It is causing vehicle damage and sudden braking leading to accidents.',
    imageUrl: 'https://images.unsplash.com/photo-1597241285493-27c191140924?auto=format&fit=crop&w=600&q=80', // realistic deep muddy pothole
    latitude: 28.6441,
    longitude: 77.1895,
    address: 'Padam Singh Road Crossroad, Karol Bagh, New Delhi - 110005',
    state: 'Delhi',
    district: 'Central Delhi',
    status: 'pending',
    verificationsCount: 5,
    verifiedUserIds: ['u1', 'u2', 'u3', 'u4', 'u5'],
    resolvedBy: 'officer_karol_bagh',
    resolvedPhotoUrl: 'https://images.unsplash.com/photo-1599740831114-171d111e40a0?auto=format&fit=crop&w=600&q=80', // smooth road look
    resolvedAt: '2026-06-25T18:00:00Z',
    createdAt: '2026-06-24T10:00:00Z'
  }
];

export const initialChatRooms: ChatRoom[] = [
  {
    id: 'chat_101',
    complaintId: 'comp_101',
    complaintTitle: 'Severe Waterlogging & Broken Drainage',
    citizenId: 'user_1',
    citizenName: 'Rahul Sharma',
    lastMessage: 'Sir, the water level is rising. Has any team been dispatched yet?',
    lastMessageAt: '2026-06-26T03:45:00Z'
  },
  {
    id: 'chat_102',
    complaintId: 'comp_102',
    complaintTitle: 'Hazardous Open High-Voltage Wire',
    citizenId: 'user_3',
    citizenName: 'Priya Patel',
    lastMessage: 'Officer, please look into this urgently. Children play here in the evening.',
    lastMessageAt: '2026-06-25T17:20:00Z'
  }
];

export const initialMessages: Record<string, Message[]> = {
  'chat_101': [
    {
      id: 'm_1',
      chatRoomId: 'chat_101',
      senderId: 'user_1',
      senderName: 'Rahul Sharma',
      senderRole: 'citizen',
      content: 'Hello, I reported this broken drain this morning. The water level is increasing due to the rains.',
      createdAt: '2026-06-25T09:00:00Z'
    },
    {
      id: 'm_2',
      chatRoomId: 'chat_101',
      senderId: 'user_2',
      senderName: 'Amit Kumar',
      senderRole: 'officer',
      content: 'Thanks for reporting, Rahul. I have viewed your live coordinates and marked it as a priority in our dashboard. We are coordinating with the municipal engineering team.',
      createdAt: '2026-06-25T10:30:00Z'
    },
    {
      id: 'm_3',
      chatRoomId: 'chat_101',
      senderId: 'user_1',
      senderName: 'Rahul Sharma',
      senderRole: 'citizen',
      content: 'Sir, the water level is rising. Has any team been dispatched yet?',
      createdAt: '2026-06-26T03:45:00Z'
    }
  ],
  'chat_102': [
    {
      id: 'm_4',
      chatRoomId: 'chat_102',
      senderId: 'user_3',
      senderName: 'Priya Patel',
      senderRole: 'citizen',
      content: 'Hi Officer, this open wire is extremely dangerous. Can someone tape it or fix the junction box?',
      createdAt: '2026-06-25T15:00:00Z'
    },
    {
      id: 'm_5',
      chatRoomId: 'chat_102',
      senderId: 'user_2',
      senderName: 'Amit Kumar',
      senderRole: 'officer',
      content: 'Received Priya. I have contacted the state electricity department to schedule emergency insulation repair.',
      createdAt: '2026-06-25T16:15:00Z'
    },
    {
      id: 'm_6',
      chatRoomId: 'chat_102',
      senderId: 'user_3',
      senderName: 'Priya Patel',
      senderRole: 'citizen',
      content: 'Officer, please look into this urgently. Children play here in the evening.',
      createdAt: '2026-06-25T17:20:00Z'
    }
  ]
};

export const initialLogs: SystemLog[] = [
  {
    id: 'log_0',
    timestamp: '2026-06-26T04:00:00-07:00',
    type: 'database',
    message: 'System database initialized with mock schema and geofencing structures.'
  },
  {
    id: 'log_1',
    timestamp: '2026-06-26T04:05:12-07:00',
    type: 'auth',
    message: 'Government Officer Amit Kumar logged in for District: New Delhi, State: Delhi.'
  },
  {
    id: 'log_2',
    timestamp: '2026-06-26T04:10:22-07:00',
    type: 'geofence',
    message: 'Geofencing check: Complaint ID comp_101 initialized at coordinates (28.6304, 77.2177). Geofence radius configured to 150 meters.'
  }
];
