import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initialComplaints, initialChatRooms, initialMessages, mockUsers } from './data/mockData';

// Monkeypatch fetch for full-fidelity client-side emulation on static deployments (e.g., Vercel)
const originalFetch = window.fetch;

const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === 'string' 
    ? input 
    : (input instanceof URL ? input.href : (input && typeof input === 'object' && 'url' in input ? (input as any).url : ''));

  // Only intercept local API endpoints
  if (typeof url === 'string' && (url.startsWith('/api/') || url.includes('/api/'))) {
    const isStaticMode = localStorage.getItem('civicguard_static_mode') === 'true';

    const handleStaticRequest = () => {
      console.log(`[Static Mock Server] Intercepted request to: ${url}`);
      
      const getLocalData = (key: string, initial: any) => {
        try {
          const val = localStorage.getItem(key);
          return val ? JSON.parse(val) : initial;
        } catch {
          return initial;
        }
      };

      const setLocalData = (key: string, data: any) => {
        try {
          localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
          console.error("Local storage set failed:", e);
        }
      };

      // Mock stores
      let mockComplaints = getLocalData('civicguard_complaints', initialComplaints);
      let mockChatRooms = getLocalData('civicguard_chatrooms', initialChatRooms);
      let mockMessages = getLocalData('civicguard_messages', initialMessages);
      let mockUsersList = getLocalData('civicguard_users', mockUsers);

      const findUserByInput = (emailOrPhone: string, role: string) => {
        const normalized = emailOrPhone.trim().toLowerCase();
        let found = Object.values(mockUsersList).find((u: any) => u.emailOrPhone.toLowerCase() === normalized && u.role === role);
        if (found) return found;
        
        const newId = 'user_' + Date.now();
        const newUser = {
          id: newId,
          emailOrPhone: emailOrPhone,
          fullName: role === 'officer' ? 'Officer ' + emailOrPhone.split('@')[0] : 'Citizen_' + emailOrPhone.slice(-4),
          role: role,
          coinBalance: 100,
          createdAt: new Date().toISOString(),
          username: role === 'officer' ? 'officer_' + emailOrPhone.split('@')[0] : 'citizen_' + emailOrPhone.slice(-4),
          avatarUrl: role === 'officer' 
            ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80'
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
        };
        mockUsersList[newId] = newUser;
        setLocalData('civicguard_users', mockUsersList);
        return newUser;
      };

      const respondWithJson = (data: any, status = 200) => {
        return new Response(JSON.stringify(data), {
          status,
          headers: { 'Content-Type': 'application/json' }
        });
      };

      let body: any = {};
      try {
        body = init?.body ? JSON.parse(init.body as string) : {};
      } catch (e) {
        // Ignored for GET or empty body
      }

      // 1. GET /api/health
      if (url.endsWith('/api/health')) {
        return respondWithJson({ status: "ok", mode: "static-mock" });
      }

      // 2. POST /api/verify-otp
      if (url.endsWith('/api/verify-otp')) {
        const { emailOrPhone, role } = body;
        const user = findUserByInput(emailOrPhone || 'guest', role || 'citizen');
        return respondWithJson({ success: true, user });
      }

      // 3. POST /api/google-login
      if (url.endsWith('/api/google-login')) {
        const { email, fullName } = body;
        let user: any = findUserByInput(email || 'google_user@gmail.com', 'citizen');
        if (fullName && user.fullName.startsWith('Citizen_')) {
          user.fullName = fullName;
          mockUsersList[user.id] = user;
          setLocalData('civicguard_users', mockUsersList);
        }
        return respondWithJson({ success: true, user });
      }

      // 4. POST /api/update-profile
      if (url.endsWith('/api/update-profile')) {
        const { id, emailOrPhone, fullName, username, avatarUrl, state, district, coinBalance } = body;
        let user: any = null;
        if (id) {
          user = mockUsersList[id];
        }
        if (!user && emailOrPhone) {
          const normalized = emailOrPhone.trim().toLowerCase();
          user = Object.values(mockUsersList).find((u: any) => u.emailOrPhone.toLowerCase() === normalized);
        }

        if (!user && emailOrPhone) {
          const isOfficer = emailOrPhone.includes('@') && emailOrPhone.toLowerCase().endsWith('gov.in');
          user = findUserByInput(emailOrPhone, isOfficer ? 'officer' : 'citizen');
        }

        if (user) {
          if (fullName !== undefined) user.fullName = fullName;
          if (username !== undefined) user.username = username;
          if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
          if (state !== undefined) user.state = state;
          if (district !== undefined) user.district = district;
          if (coinBalance !== undefined) user.coinBalance = coinBalance;

          mockUsersList[user.id] = user;
          setLocalData('civicguard_users', mockUsersList);
          return respondWithJson({ success: true, user });
        }
        return respondWithJson({ error: "Invalid user data" }, 400);
      }

      // 5. GET /api/complaints
      if (url.endsWith('/api/complaints')) {
        return respondWithJson(mockComplaints);
      }

      // 6. GET /api/leaderboard
      if (url.endsWith('/api/leaderboard')) {
        const list = Object.values(mockUsersList)
          .filter((u: any) => u.role === 'citizen')
          .map((u: any) => ({
            id: u.id,
            fullName: u.fullName,
            username: u.username,
            avatarUrl: u.avatarUrl,
            coinBalance: u.coinBalance,
            reportsCount: mockComplaints.filter((c: any) => c.reporterId === u.id).length
          }))
          .sort((a: any, b: any) => b.coinBalance - a.coinBalance);
        return respondWithJson(list);
      }

      // 7. POST /api/complaints
      if (url.endsWith('/api/complaints') && init?.method === 'POST') {
        const newComplaint = {
          ...body,
          id: 'comp_' + Date.now(),
          status: 'pending',
          verificationsCount: 0,
          upvotesCount: 0,
          downvotesCount: 0,
          verifiedUserIds: [],
          upvotedUserIds: [],
          downvotedUserIds: [],
          createdAt: new Date().toISOString()
        };
        mockComplaints.push(newComplaint);
        setLocalData('civicguard_complaints', mockComplaints);

        // Auto-create chatroom
        const newRoom = {
          id: 'chat_' + Date.now(),
          complaintId: newComplaint.id,
          name: `${newComplaint.title.slice(0, 25)} Discussion`,
          createdAt: new Date().toISOString()
        };
        mockChatRooms.push(newRoom);
        setLocalData('civicguard_chatrooms', mockChatRooms);

        // Seed initial room message
        mockMessages[newRoom.id] = [
          {
            id: 'msg_init_' + Date.now(),
            chatRoomId: newRoom.id,
            senderId: 'system',
            senderName: 'CivicGuard Gateway',
            senderRole: 'system',
            content: `Complaint '${newComplaint.title}' logged successfully. Discussion channel initialized.`,
            createdAt: new Date().toISOString()
          }
        ];
        setLocalData('civicguard_messages', mockMessages);

        return respondWithJson(newComplaint);
      }

      // 8. PUT /api/complaints/:id
      if (url.includes('/api/complaints/')) {
        const compId = url.split('/').pop();
        const index = mockComplaints.findIndex((c: any) => c.id === compId);
        if (index !== -1) {
          mockComplaints[index] = { ...mockComplaints[index], ...body };
          setLocalData('civicguard_complaints', mockComplaints);
          return respondWithJson(mockComplaints[index]);
        }
        return respondWithJson({ error: "Complaint not found" }, 404);
      }

      // 9. GET /api/chatrooms
      if (url.endsWith('/api/chatrooms')) {
        return respondWithJson(mockChatRooms);
      }

      // 10. GET /api/messages/:chatRoomId
      if (url.includes('/api/messages/')) {
        const chatRoomId = url.split('/').pop() || '';
        return respondWithJson(mockMessages[chatRoomId] || []);
      }

      // 11. POST /api/messages
      if (url.endsWith('/api/messages') && init?.method === 'POST') {
        const { chatRoomId } = body;
        const newMsg = {
          ...body,
          id: 'msg_' + Date.now(),
          createdAt: new Date().toISOString()
        };
        if (!mockMessages[chatRoomId]) {
          mockMessages[chatRoomId] = [];
        }
        mockMessages[chatRoomId].push(newMsg);
        setLocalData('civicguard_messages', mockMessages);
        return respondWithJson(newMsg);
      }

      // 12. POST /api/compare-images
      if (url.endsWith('/api/compare-images')) {
        return respondWithJson({
          similarityScore: 89.4,
          matchingFeatures: ['sewage_drain_covers', 'road_texture', 'water_level_landmarks'],
          matches: true,
          auditDetails: "AI computer-vision confirms high likeness with reported waterlogging at this geofence segment."
        });
      }

      // Default fallback
      return respondWithJson({ error: "Endpoint mocked" }, 200);
    };

    if (isStaticMode) {
      return handleStaticRequest();
    }

    try {
      const originalResponse = await originalFetch(input, init);
      const contentType = originalResponse.headers.get('content-type') || '';
      
      // If Vercel/CDN returned 404 with HTML (or any non-json for an API request)
      if (!originalResponse.ok || !contentType.includes('application/json')) {
        console.warn(`[API Failure] Server returned ${originalResponse.status} ${contentType}. Toggling client-only static sandbox mode.`);
        localStorage.setItem('civicguard_static_mode', 'true');
        return handleStaticRequest();
      }

      return originalResponse;
    } catch (err) {
      console.warn(`[API Network Error] ${err}. Toggling client-only static sandbox mode.`);
      localStorage.setItem('civicguard_static_mode', 'true');
      return handleStaticRequest();
    }
  }

  return originalFetch(input, init);
};

try {
  Object.defineProperty(window, 'fetch', {
    configurable: true,
    enumerable: true,
    writable: true,
    value: customFetch
  });
} catch (e) {
  console.warn("Direct defineProperty override failed, falling back to window.fetch assignment:", e);
  try {
    (window as any).fetch = customFetch;
  } catch (err) {
    console.error("Critical error: Unable to override window.fetch:", err);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

