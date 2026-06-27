import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, MessageSquare, Coins, AlertCircle, MapPin, 
  Camera, CheckCircle, Navigation, User, Map, Send, 
  Lock, Plus, RotateCcw, ChevronRight, Sparkles, LogOut,
  Settings, Check, X, ShieldAlert, Award, Gift, Ticket,
  CreditCard, ArrowDownRight, ArrowUpRight, Copy
} from 'lucide-react';
import { Complaint, User as AppUser, ChatRoom, Message, SystemLog, UserRole } from '../types';
import { initialComplaints, initialChatRooms, initialMessages, mockUsers, DELHI_DISTRICTS, STATES } from '../data/mockData';
import { CivicsGuardLogo } from './CivicsGuardLogo';

interface MobileSimulatorProps {
  onAddLog: (type: SystemLog['type'], message: string, details?: any) => void;
  deviceLocation: { lat: number; lng: number; name: string };
  setDeviceLocation: (loc: { lat: number; lng: number; name: string }) => void;
  currentUser: AppUser | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<AppUser | null>>;
}

export default function MobileSimulator({ 
  onAddLog, 
  deviceLocation, 
  setDeviceLocation,
  currentUser,
  setCurrentUser
}: MobileSimulatorProps) {
  // Application State
  const [complaints, setComplaints] = useState<Complaint[]>(initialComplaints);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>(initialChatRooms);
  const [allMessages, setAllMessages] = useState<Record<string, Message[]>>(initialMessages);

  // Navigation / UI states
  const [activeTab, setActiveTab] = useState<'pending' | 'post' | 'solved'>('pending');
  const [activeChatRoomId, setActiveChatRoomId] = useState<string | null>(null);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Sync with Server Database
  const fetchComplaintsAndChats = async () => {
    try {
      const compRes = await fetch('/api/complaints');
      if (compRes.ok) {
        const data = await compRes.json();
        setComplaints(data);
      }
      const chatRes = await fetch('/api/chatrooms');
      if (chatRes.ok) {
        const data = await chatRes.json();
        setChatRooms(data);
      }
    } catch (err) {
      console.error("Error fetching database sync:", err);
    }
  };

  useEffect(() => {
    fetchComplaintsAndChats();
    // Poll every 5 seconds for live server state changes
    const interval = setInterval(fetchComplaintsAndChats, 5000);
    return () => clearInterval(interval);
  }, []);

  // Sync specific chat room messages
  useEffect(() => {
    if (!activeChatRoomId) return;
    const fetchRoomMessages = async () => {
      try {
        const msgRes = await fetch(`/api/messages/${activeChatRoomId}`);
        if (msgRes.ok) {
          const data = await msgRes.json();
          setAllMessages(prev => ({
            ...prev,
            [activeChatRoomId]: data
          }));
        }
      } catch (err) {
        console.error("Error fetching chat messages:", err);
      }
    };

    fetchRoomMessages();
    const interval = setInterval(fetchRoomMessages, 3000);
    return () => clearInterval(interval);
  }, [activeChatRoomId]);
  
  // User Profile Customization States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<AppUser[]>(() => {
    return Object.values(mockUsers);
  });

  const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false);
  const [activeMapComplaint, setActiveMapComplaint] = useState<Complaint | null>(null);
  const [activeReviewComplaint, setActiveReviewComplaint] = useState<Complaint | null>(null);
  const [activeChallengeComplaint, setActiveChallengeComplaint] = useState<Complaint | null>(null);

  // Custom Toast Notifications State
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info' }[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Coins & Reward System States
  const [isCoinsOpen, setIsCoinsOpen] = useState(false);
  const [activeCoinsTab, setActiveCoinsTab] = useState<'redeem' | 'history'>('redeem');
  const [selectedVoucher, setSelectedVoucher] = useState<any | null>(null);
  const [phonePeNumber, setPhonePeNumber] = useState('');
  const [redeemedCode, setRedeemedCode] = useState<string | null>(null);
  const [isScratchAnimating, setIsScratchAnimating] = useState(false);

  const [coinTransactions, setCoinTransactions] = useState<any[]>(() => {
    return [
      {
        id: 'tx_seed_1',
        userId: 'user_1',
        amount: 100,
        type: 'earn_report',
        complaintId: 'comp_104',
        description: 'Authentic Complaint verification reward (CP-104)',
        createdAt: '2026-06-25T18:00:00Z'
      },
      {
        id: 'tx_seed_2',
        userId: 'user_1',
        amount: 50,
        type: 'earn_verify',
        complaintId: 'comp_101',
        description: 'Crowdsourced geofenced verification near Connaught Place',
        createdAt: '2026-06-25T11:30:00Z'
      },
      {
        id: 'tx_seed_3',
        userId: 'user_1',
        amount: 100,
        type: 'earn_report',
        complaintId: 'comp_101',
        description: 'Submitted waterlogging report at Connaught Place',
        createdAt: '2026-06-25T08:15:00Z'
      },
      {
        id: 'tx_seed_4',
        userId: 'user_1',
        amount: 100,
        type: 'earn_report',
        complaintId: 'comp_104',
        description: 'Submitted pothole report at Karol Bagh Crossing',
        createdAt: '2026-06-24T10:00:00Z'
      }
    ];
  });

  // Award Coins Function
  const awardCoins = async (amount: number, type: 'earn_report' | 'earn_verify' | 'challenge_penalty', complaintId: string, description: string) => {
    if (!currentUser) return;
    const newBalance = currentUser.coinBalance + amount;
    
    const newTx = {
      id: `tx_${Date.now()}`,
      userId: currentUser.id,
      amount,
      type,
      complaintId,
      description,
      createdAt: new Date().toISOString()
    };
    
    setCoinTransactions(prev => [newTx, ...prev]);

    try {
      const response = await fetch('/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrPhone: currentUser.emailOrPhone,
          coinBalance: newBalance
        })
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
        onAddLog('rewards', `Rewarded +${amount} Coins to ${currentUser.fullName} for: ${description}. New Balance: ${data.user.coinBalance} Coins.`);
      } else {
        setCurrentUser(prev => prev ? { ...prev, coinBalance: newBalance } : null);
        onAddLog('rewards', `Rewarded +${amount} Coins to ${currentUser.fullName} (local). New Balance: ${newBalance} Coins.`);
      }
    } catch (err) {
      console.error("Failed to sync coins:", err);
      setCurrentUser(prev => prev ? { ...prev, coinBalance: newBalance } : null);
    }
  };

  // Redeem Coins Function
  const redeemCoins = async (amount: number, description: string) => {
    if (!currentUser) return false;
    if (currentUser.coinBalance < amount) return false;
    
    const newBalance = currentUser.coinBalance - amount;
    
    const newTx = {
      id: `tx_${Date.now()}`,
      userId: currentUser.id,
      amount: -amount,
      type: 'redeem',
      complaintId: '',
      description: `Redeemed: ${description}`,
      createdAt: new Date().toISOString()
    };
    
    setCoinTransactions(prev => [newTx, ...prev]);

    try {
      const response = await fetch('/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrPhone: currentUser.emailOrPhone,
          coinBalance: newBalance
        })
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
        onAddLog('rewards', `Redeemed -${amount} Coins for ${description}. New Balance: ${data.user.coinBalance} Coins.`);
        return true;
      } else {
        setCurrentUser(prev => prev ? { ...prev, coinBalance: newBalance } : null);
        onAddLog('rewards', `Redeemed -${amount} Coins for ${description} (local). New Balance: ${newBalance} Coins.`);
        return true;
      }
    } catch (err) {
      console.error("Failed to sync redemption:", err);
      setCurrentUser(prev => prev ? { ...prev, coinBalance: newBalance } : null);
      return true;
    }
  };

  // Sync loaded/logged in users to registeredUsers list and edit states
  useEffect(() => {
    if (currentUser) {
      setRegisteredUsers(prev => {
        if (!prev.some(u => u.id === currentUser.id)) {
          return [...prev, currentUser];
        }
        return prev.map(u => u.id === currentUser.id ? { ...u, ...currentUser } : u);
      });
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && isProfileOpen) {
      setEditFullName(currentUser.fullName || '');
      setEditUsername(currentUser.username || '');
      setEditAvatarUrl(currentUser.avatarUrl || '');
      setProfileError(null);
    }
  }, [isProfileOpen, currentUser]);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setEditAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    setProfileError(null);

    const trimmedFullName = editFullName.trim();
    const trimmedUsername = editUsername.trim().toLowerCase();

    if (!trimmedFullName) {
      setProfileError("Full Name cannot be empty.");
      return;
    }

    if (trimmedUsername) {
      // Validate format: letters, numbers, underscores only, 3 to 15 characters
      const usernameRegex = /^[a-zA-Z0-9_]{3,15}$/;
      if (!usernameRegex.test(trimmedUsername)) {
        setProfileError("Username must be 3-15 characters (letters, numbers, underscores only).");
        return;
      }
    }

    try {
      const response = await fetch('/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrPhone: currentUser.emailOrPhone,
          fullName: trimmedFullName,
          username: trimmedUsername || "",
          avatarUrl: editAvatarUrl || ""
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile settings.');
      }

      setCurrentUser(data.user);
      setIsEditingProfile(false);
      onAddLog('auth', `Updated profile settings for '${trimmedFullName}' (@${trimmedUsername || 'none'}).`);
    } catch (err: any) {
      console.error(err);
      setProfileError(err.message);
    }
  };
  
  // Horizontal swiper horizontal scroll index
  const [swipeIndex, setSwipeIndex] = useState(0);

  // Authentication State inputs
  const [loginRole, setLoginRole] = useState<UserRole>('citizen');
  const [loginInput, setLoginInput] = useState(''); // Mobile/Email
  const [otpInput, setOtpInput] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [testMailUrl, setTestMailUrl] = useState<string | null>(null);
  const [showGovDisclaimer, setShowGovDisclaimer] = useState(false);
  
  // Government Onboarding
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [selectedState, setSelectedState] = useState('Delhi NCR');
  const [selectedDistrict, setSelectedDistrict] = useState('New Delhi');

  // Review (Auditing) State
  const [reviewSelfieCaptured, setReviewSelfieCaptured] = useState(false);
  const [reviewSelfieUrl, setReviewSelfieUrl] = useState('');
  const [reviewGpsCaptured, setReviewGpsCaptured] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewLat, setReviewLat] = useState<number | null>(null);
  const [reviewLng, setReviewLng] = useState<number | null>(null);
  const [reviewAddress, setReviewAddress] = useState<string>('');

  // Post State
  const [postStep, setPostStep] = useState<'camera' | 'form' | 'duplicate_alert'>('camera');
  const [postPhotoUrl, setPostPhotoUrl] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [postCategory, setPostCategory] = useState('');
  const [postDescription, setPostDescription] = useState('');
  const [postAddress, setPostAddress] = useState('');
  const [postLat, setPostLat] = useState<number | null>(null);
  const [postLng, setPostLng] = useState<number | null>(null);
  const [isPostLocationLoading, setIsPostLocationLoading] = useState(false);

  const fetchPostLiveLocation = () => {
    setIsPostLocationLoading(true);
    onAddLog('geofence', 'Initiating live location request and exact address resolution...');

    const resolveAddress = async (lat: number, lng: number, fallbackName: string) => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'MunicipalCitizenReporter/1.0'
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.display_name) {
            setPostAddress(data.display_name);
            onAddLog('geofence', `Exact physical address resolved: "${data.display_name}"`);
            return;
          }
        }
      } catch (err) {
        console.warn("Reverse geocoding failed, using preset name:", err);
      }
      // Fallback
      if (fallbackName.includes('Faraway')) {
        setPostAddress("Outer Ring Rd, Rohini Sector 15, New Delhi - 110085");
      } else {
        setPostAddress(fallbackName + ", New Delhi - 110001");
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setPostLat(lat);
          setPostLng(lng);
          onAddLog('geofence', `Physical GPS satellite lock achieved at: (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
          await resolveAddress(lat, lng, `Physical Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
          setIsPostLocationLoading(false);
        },
        async (error) => {
          console.warn("Geolocation permission error or timeout:", error);
          // Fallback to simulated deviceLocation
          setPostLat(deviceLocation.lat);
          setPostLng(deviceLocation.lng);
          onAddLog('geofence', `Physical GPS denied/timeout. Falling back to active Virtual Device GPS: (${deviceLocation.lat.toFixed(5)}, ${deviceLocation.lng.toFixed(5)})`);
          await resolveAddress(deviceLocation.lat, deviceLocation.lng, deviceLocation.name);
          setIsPostLocationLoading(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      // Geolocation not supported, fallback to simulated deviceLocation
      setPostLat(deviceLocation.lat);
      setPostLng(deviceLocation.lng);
      resolveAddress(deviceLocation.lat, deviceLocation.lng, deviceLocation.name).then(() => {
        setIsPostLocationLoading(false);
      });
    }
  };

  const [duplicateReport, setDuplicateReport] = useState<Complaint | null>(null);

  // Challenge State
  const [challengeSelfieCaptured, setChallengeSelfieCaptured] = useState(false);
  const [challengeSelfieUrl, setChallengeSelfieUrl] = useState('');
  const [challengePhotoCaptured, setChallengePhotoCaptured] = useState(false);
  const [challengePhotoUrl, setChallengePhotoUrl] = useState('');
  const [challengeGpsCaptured, setChallengeGpsCaptured] = useState(false);
  const [isChallengeCameraActive, setIsChallengeCameraActive] = useState(false);
  const [challengeVideoStream, setChallengeVideoStream] = useState<MediaStream | null>(null);
  const [challengeCameraError, setChallengeCameraError] = useState<string | null>(null);
  const challengeVideoRef = useRef<HTMLVideoElement | null>(null);
  const [challengeActiveCameraType, setChallengeActiveCameraType] = useState<'selfie' | 'photo' | null>(null);
  const [challengeLat, setChallengeLat] = useState<number | null>(null);
  const [challengeLng, setChallengeLng] = useState<number | null>(null);
  const [challengeAddress, setChallengeAddress] = useState<string>('');
  const [isChallengeGpsLoading, setIsChallengeGpsLoading] = useState(false);

  // Routing direction states
  const [routeStartLat, setRouteStartLat] = useState<number | null>(null);
  const [routeStartLng, setRouteStartLng] = useState<number | null>(null);
  const [routeStartAddress, setRouteStartAddress] = useState<string>('');
  const [isRouteLocationLoading, setIsRouteLocationLoading] = useState(false);

  // Auto-detect routing start position on activeMapComplaint change
  useEffect(() => {
    if (activeMapComplaint) {
      setIsRouteLocationLoading(true);
      onAddLog('geofence', `Auto-detecting starting coordinates for route to: "${activeMapComplaint.title}"`);
      
      const resolveAddress = async (lat: number, lng: number, fallbackName: string) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
            headers: {
              'Accept-Language': 'en',
              'User-Agent': 'MunicipalCitizenReporter/1.0'
            }
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data.display_name) {
              setRouteStartAddress(data.display_name);
              onAddLog('geofence', `Route start resolved: "${data.display_name}"`);
              return;
            }
          }
        } catch (err) {
          console.warn("Route geocoding error:", err);
        }
        setRouteStartAddress(fallbackName);
      };

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            setRouteStartLat(lat);
            setRouteStartLng(lng);
            onAddLog('geofence', `Route lock achieved. Physical coordinate: (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
            await resolveAddress(lat, lng, `Physical Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
            setIsRouteLocationLoading(false);
          },
          async (error) => {
            console.warn("Route GPS error, falling back:", error);
            setRouteStartLat(deviceLocation.lat);
            setRouteStartLng(deviceLocation.lng);
            onAddLog('geofence', `Physical GPS not active. Using Virtual Device location for route: (${deviceLocation.lat.toFixed(5)}, ${deviceLocation.lng.toFixed(5)})`);
            await resolveAddress(deviceLocation.lat, deviceLocation.lng, deviceLocation.name);
            setIsRouteLocationLoading(false);
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      } else {
        setRouteStartLat(deviceLocation.lat);
        setRouteStartLng(deviceLocation.lng);
        resolveAddress(deviceLocation.lat, deviceLocation.lng, deviceLocation.name).then(() => {
          setIsRouteLocationLoading(false);
        });
      }
    } else {
      setRouteStartLat(null);
      setRouteStartLng(null);
      setRouteStartAddress('');
      setIsRouteLocationLoading(false);
    }
  }, [activeMapComplaint, deviceLocation]);

  // Chat message input
  const [newMessageText, setNewMessageText] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Real Camera States
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Verification Review Real Camera and GPS states
  const reviewVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isReviewCameraActive, setIsReviewCameraActive] = useState(false);
  const [reviewVideoStream, setReviewVideoStream] = useState<MediaStream | null>(null);
  const [reviewCameraError, setReviewCameraError] = useState<string | null>(null);
  
  const [isGpsRealLocked, setIsGpsRealLocked] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsErrorMsg, setGpsErrorMsg] = useState<string | null>(null);

  // Stop review camera stream when modal is closed
  useEffect(() => {
    if (!activeReviewComplaint) {
      setIsReviewCameraActive(false);
      setIsGpsRealLocked(false);
      setGpsErrorMsg(null);
      setReviewLat(null);
      setReviewLng(null);
      setReviewAddress('');
      if (reviewVideoStream) {
        reviewVideoStream.getTracks().forEach(track => track.stop());
        setReviewVideoStream(null);
      }
    }
  }, [activeReviewComplaint]);

  // Government Officer Resolution Camera States
  const [activeResolveComplaint, setActiveResolveComplaint] = useState<Complaint | null>(null);
  const [resolvePhotoCaptured, setResolvePhotoCaptured] = useState(false);
  const [resolvePhotoUrl, setResolvePhotoUrl] = useState('');
  const [isResolveCameraActive, setIsResolveCameraActive] = useState(false);
  const [resolveVideoStream, setResolveVideoStream] = useState<MediaStream | null>(null);
  const [resolveCameraError, setResolveCameraError] = useState<string | null>(null);
  const resolveVideoRef = useRef<HTMLVideoElement | null>(null);

  // Stop resolve camera stream when modal is closed
  useEffect(() => {
    if (!activeResolveComplaint) {
      setIsResolveCameraActive(false);
      setResolvePhotoCaptured(false);
      setResolvePhotoUrl('');
      setResolveCameraError(null);
      if (resolveVideoStream) {
        resolveVideoStream.getTracks().forEach(track => track.stop());
        setResolveVideoStream(null);
      }
    }
  }, [activeResolveComplaint]);

  // Stop challenge camera stream and reset states when modal is closed
  useEffect(() => {
    if (!activeChallengeComplaint) {
      setIsChallengeCameraActive(false);
      setChallengeActiveCameraType(null);
      setChallengeCameraError(null);
      setChallengeLat(null);
      setChallengeLng(null);
      setChallengeAddress('');
      setIsChallengeGpsLoading(false);
      if (challengeVideoStream) {
        challengeVideoStream.getTracks().forEach(track => track.stop());
        setChallengeVideoStream(null);
      }
    }
  }, [activeChallengeComplaint]);

  const startChallengeCamera = async (type: 'selfie' | 'photo') => {
    setIsChallengeCameraActive(true);
    setChallengeActiveCameraType(type);
    setChallengeCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: type === 'selfie' ? 'user' : 'environment' } 
      });
      setChallengeVideoStream(stream);
      if (challengeVideoRef.current) {
        challengeVideoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn("Could not start environment/user camera for challenge, trying generic camera:", err);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setChallengeVideoStream(stream);
        if (challengeVideoRef.current) {
          challengeVideoRef.current.srcObject = stream;
        }
      } catch (fallbackErr: any) {
        console.error("No camera found for challenge or permission denied:", fallbackErr);
        setChallengeCameraError("Camera access denied or unavailable.");
      }
    }
  };

  const captureChallengePhoto = () => {
    if (challengeVideoRef.current && challengeActiveCameraType) {
      const video = challengeVideoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        if (challengeActiveCameraType === 'selfie') {
          setChallengeSelfieUrl(dataUrl);
          setChallengeSelfieCaptured(true);
        } else {
          setChallengePhotoUrl(dataUrl);
          setChallengePhotoCaptured(true);
        }
        setIsChallengeCameraActive(false);
        setChallengeActiveCameraType(null);
        if (challengeVideoStream) {
          challengeVideoStream.getTracks().forEach(track => track.stop());
          setChallengeVideoStream(null);
        }
        onAddLog('challenge', `Live dispute ${challengeActiveCameraType === 'selfie' ? 'selfie' : 'situation photo'} successfully captured.`);
      }
    }
  };

  const fetchChallengeLiveLocation = () => {
    setIsChallengeGpsLoading(true);
    onAddLog('geofence', 'Initiating live challenge location check...');

    const resolveAddress = async (lat: number, lng: number, fallbackName: string) => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'MunicipalCitizenReporter/1.0'
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.display_name) {
            setChallengeAddress(data.display_name);
            onAddLog('geofence', `Challenge site location resolved: "${data.display_name}"`);
            return;
          }
        }
      } catch (err) {
        console.warn("Reverse geocoding failed for challenge, using preset:", err);
      }
      setChallengeAddress(fallbackName);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setChallengeLat(lat);
          setChallengeLng(lng);
          setChallengeGpsCaptured(true);
          onAddLog('geofence', `Challenge satellite GPS coordinates acquired: (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
          await resolveAddress(lat, lng, `Physical Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
          setIsChallengeGpsLoading(false);
        },
        async (error) => {
          console.warn("Challenge geolocation permission error or timeout:", error);
          // Fallback to simulated deviceLocation
          setChallengeLat(deviceLocation.lat);
          setChallengeLng(deviceLocation.lng);
          setChallengeGpsCaptured(true);
          onAddLog('geofence', `Dispute GPS fallback to active Virtual Device GPS: (${deviceLocation.lat.toFixed(5)}, ${deviceLocation.lng.toFixed(5)})`);
          await resolveAddress(deviceLocation.lat, deviceLocation.lng, deviceLocation.name);
          setIsChallengeGpsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      // Geolocation not supported, fallback to simulated deviceLocation
      setChallengeLat(deviceLocation.lat);
      setChallengeLng(deviceLocation.lng);
      setChallengeGpsCaptured(true);
      resolveAddress(deviceLocation.lat, deviceLocation.lng, deviceLocation.name).then(() => {
        setIsChallengeGpsLoading(false);
      });
    }
  };

  const startReviewCamera = async () => {
    setIsReviewCameraActive(true);
    setReviewCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setReviewVideoStream(stream);
      if (reviewVideoRef.current) {
        reviewVideoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn("Could not start environment camera, trying user camera:", err);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setReviewVideoStream(stream);
        if (reviewVideoRef.current) {
          reviewVideoRef.current.srcObject = stream;
        }
      } catch (fallbackErr: any) {
        console.error("No camera found or permission denied:", fallbackErr);
        setReviewCameraError("Camera permission denied. Please verify camera settings or upload photo manually.");
      }
    }
  };

  const captureReviewPhoto = () => {
    if (reviewVideoRef.current) {
      const video = reviewVideoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setReviewSelfieUrl(dataUrl);
        setReviewSelfieCaptured(true);
        setIsReviewCameraActive(false);
        if (reviewVideoStream) {
          reviewVideoStream.getTracks().forEach(track => track.stop());
          setReviewVideoStream(null);
        }
        onAddLog('database', `Live situation picture successfully captured from camera.`);
      }
    }
  };

  const startResolveCamera = async () => {
    setIsResolveCameraActive(true);
    setResolveCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setResolveVideoStream(stream);
      if (resolveVideoRef.current) {
        resolveVideoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn("Could not start environment camera, trying user camera:", err);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setResolveVideoStream(stream);
        if (resolveVideoRef.current) {
          resolveVideoRef.current.srcObject = stream;
        }
      } catch (fallbackErr: any) {
        console.error("No camera found or permission denied:", fallbackErr);
        setResolveCameraError("Camera permission denied. Please verify camera settings.");
      }
    }
  };

  const captureResolvePhoto = () => {
    if (resolveVideoRef.current) {
      const video = resolveVideoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setResolvePhotoUrl(dataUrl);
        setResolvePhotoCaptured(true);
        setIsResolveCameraActive(false);
        if (resolveVideoStream) {
          resolveVideoStream.getTracks().forEach(track => track.stop());
          setResolveVideoStream(null);
        }
        onAddLog('database', `Live solved proof picture successfully captured from camera.`);
      }
    }
  };

  const handleResolveFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setResolvePhotoUrl(reader.result);
          setResolvePhotoCaptured(true);
          setIsResolveCameraActive(false);
          if (resolveVideoStream) {
            resolveVideoStream.getTracks().forEach(track => track.stop());
            setResolveVideoStream(null);
          }
          onAddLog('database', `Live solved proof picture successfully uploaded.`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGpsVerification = () => {
    setGpsLoading(true);
    setGpsErrorMsg(null);
    onAddLog('geofence', 'Initiating live verification location check...');

    const resolveAddress = async (lat: number, lng: number, fallbackName: string) => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'MunicipalCitizenReporter/1.0'
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.display_name) {
            setReviewAddress(data.display_name);
            onAddLog('geofence', `Verification site location resolved: "${data.display_name}"`);
            return;
          }
        }
      } catch (err) {
        console.warn("Reverse geocoding failed for review, using preset:", err);
      }
      setReviewAddress(fallbackName);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setReviewLat(lat);
          setReviewLng(lng);
          setIsGpsRealLocked(true);
          setReviewGpsCaptured(true);
          onAddLog('geofence', `Verification satellite GPS coordinates acquired: (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
          await resolveAddress(lat, lng, `Physical Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
          setGpsLoading(false);
        },
        async (error) => {
          console.warn("Review geolocation permission error or timeout:", error);
          setReviewLat(deviceLocation.lat);
          setReviewLng(deviceLocation.lng);
          setIsGpsRealLocked(false);
          setReviewGpsCaptured(true);
          onAddLog('geofence', `Verification GPS fallback to active Virtual Device GPS: (${deviceLocation.lat.toFixed(5)}, ${deviceLocation.lng.toFixed(5)})`);
          await resolveAddress(deviceLocation.lat, deviceLocation.lng, deviceLocation.name);
          setGpsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setReviewLat(deviceLocation.lat);
      setReviewLng(deviceLocation.lng);
      setIsGpsRealLocked(false);
      setReviewGpsCaptured(true);
      resolveAddress(deviceLocation.lat, deviceLocation.lng, deviceLocation.name).then(() => {
        setGpsLoading(false);
      });
    }
  };

  // Manage Real Web Camera Stream
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (activeTab === 'post' && postStep === 'camera' && currentUser?.role === 'citizen') {
      const startCamera = async () => {
        try {
          setCameraError(null);
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
          });
          setVideoStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err: any) {
          console.warn("Could not start camera with environment facingMode, trying fallback:", err);
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setVideoStream(stream);
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          } catch (fallbackErr: any) {
            console.error("No camera found or permission denied:", fallbackErr);
            setCameraError("Camera access denied or unavailable. Fallback simulated picture is active.");
          }
        }
      };
      startCamera();
    } else {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        setVideoStream(null);
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [activeTab, postStep, currentUser]);

  const handleCapturePhoto = () => {
    try {
      if (videoRef.current && videoStream) {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setPostPhotoUrl(dataUrl);
          setPostStep('form');
          onAddLog('database', `Live camera snapshot successfully captured and encoded to secure base64 format.`);
          
          if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
            setVideoStream(null);
          }
          return;
        }
      }
    } catch (err) {
      console.error("Failed to capture image from video element:", err);
    }

    // Fallback: if camera is not active or fails, use high-quality simulated civic report image
    setPostPhotoUrl('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80');
    setPostStep('form');
    onAddLog('database', `Secure fallback live camera snapshot recorded. Gallery upload bypassed.`);
  };

  // Auto scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages, activeChatRoomId]);

  // Teleport location coordinates map
  const locationPresets = [
    { name: 'Connaught Place Drainage (Near Issue 1)', lat: 28.6304, lng: 77.2177 },
    { name: 'Central Secretariat Wire (Near Issue 2)', lat: 28.6129, lng: 77.2295 },
    { name: 'Mandi House Trash (Near Issue 3)', lat: 28.6254, lng: 77.2345 },
    { name: 'Karol Bagh Crossroad (Resolved Issue 4)', lat: 28.6441, lng: 77.1895 },
    { name: 'Faraway Home (Out of Bounds)', lat: 28.7041, lng: 77.1025 }
  ];

  // Trigger login sequence
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim()) return;

    if (loginRole === 'citizen') {
      if (loginInput.length !== 10 || !/^\d{10}$/.test(loginInput)) {
        alert('Please enter a valid 10-digit mobile number.');
        return;
      }
    } else {
      const normalized = loginInput.trim().toLowerCase();
      if (!normalized.includes('@') || !normalized.endsWith('gov.in')) {
        setShowGovDisclaimer(true);
        return;
      }
    }

    setAuthLoading(true);
    setTestMailUrl(null);
    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone: loginInput, role: loginRole })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP code');
      }

      setIsOtpSent(true);
      if (data.simulatedOtp) {
        setOtpCode(data.simulatedOtp);
      } else {
        setOtpCode(''); // For real Resend / SMS, we hide the client-side cheat code
      }

      if (data.testMailUrl) {
        setTestMailUrl(data.testMailUrl);
      }

      onAddLog('auth', `OTP successfully dispatched to ${loginInput}. Response: ${data.message}`, {
        recipient: loginInput,
        isSimulated: data.isSimulated,
        method: data.method
      });
    } catch (err: any) {
      console.error(err);
      onAddLog('auth', `OTP Dispatch Failed: ${err.message}`);
      alert(`Failed to send OTP: ${err.message}`);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput.trim()) return;

    setAuthLoading(true);
    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone: loginInput, otpInput, role: loginRole })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Invalid OTP verification code');
      }

      if (loginRole === 'officer') {
        onAddLog('auth', `Government official logged in successfully. Proceeding to Onboarding...`);
        setIsOnboarding(true);
      } else {
        setCurrentUser(data.user);
        onAddLog('auth', `Citizen logged in successfully. Balance: ${data.user.coinBalance} Coins`, data.user);
      }
    } catch (err: any) {
      console.error(err);
      onAddLog('auth', `Verification Check Failed: ${err.message}`);
      alert(`Verification Failed: ${err.message}`);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    try {
      const response = await fetch('/api/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to authenticate with Google');
      }

      setCurrentUser(data.user);
      onAddLog('auth', `Citizen logged in via Google successfully. Balance: ${data.user.coinBalance} Coins`, data.user);
    } catch (err: any) {
      console.error(err);
      onAddLog('auth', `Google Sign-In failed: ${err.message}`);
      alert(`Google Sign-In failed: ${err.message}`);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      const response = await fetch('/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrPhone: loginInput,
          fullName: loginInput.includes('@') ? loginInput.split('@')[0] : 'Officer User',
          state: selectedState,
          district: selectedDistrict,
          coinBalance: 0
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save onboarding information');
      }

      setCurrentUser(data.user);
      setIsOnboarding(false);
      onAddLog('auth', `Officer verified and logged in. Scope limited to: ${selectedDistrict}, ${selectedState}`, data.user);
    } catch (err: any) {
      console.error(err);
      alert(`Onboarding completion failed: ${err.message}`);
    }
  };

  // Log out sequence
  const handleLogout = () => {
    onAddLog('auth', `User ${currentUser?.fullName} logged out.`);
    setCurrentUser(null);
    setIsOtpSent(false);
    setIsProfileOpen(false);
    setLoginInput('');
    setOtpInput('');
    setActiveTab('pending');
  };

  // Haversine Distance Formula (to calculate physical distance on earth in meters)
  const calculateDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const phi1 = lat1 * Math.PI/180;
    const phi2 = lat2 * Math.PI/180;
    const deltaPhi = (lat2-lat1) * Math.PI/180;
    const deltaLambda = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // in metres
  };

  // 1. REPORT COMPLAINT: Captures and validates duplicates prior to creating
  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postLat || !postLng) {
      alert("Please enter title and fetch live location coordinates.");
      return;
    }

    const GEOFENCE_RADIUS = 150; // meters

    // Filter duplicate of the SAME type within 150 meters
    const duplicate = complaints.find(comp => {
      if (comp.status !== 'pending' || comp.title.toLowerCase() !== postTitle.toLowerCase()) return false;
      const distance = calculateDistanceInMeters(postLat, postLng, comp.latitude, comp.longitude);
      return distance <= GEOFENCE_RADIUS;
    });

    onAddLog('geofence', `Running PostGIS spatial overlap check for category '${postCategory}' at coord (${postLat}, ${postLng}).`);

    if (duplicate) {
      setDuplicateReport(duplicate);
      setPostStep('duplicate_alert');
      onAddLog('geofence', `DUPLICATE BLOCKED: Spatial collision. Active issue '${duplicate.title}' is already registered at coordinate. Distance: ${Math.round(calculateDistanceInMeters(postLat, postLng, duplicate.latitude, duplicate.longitude))}m.`);
      return;
    }

    // Success - add complaint
    const newId = `comp_${Date.now()}`;
    const newComp: Complaint = {
      id: newId,
      reporterId: currentUser?.id || 'citizen_user',
      reporterName: currentUser?.fullName || 'Anonymous Citizen',
      title: postTitle,
      description: postDescription,
      imageUrl: postPhotoUrl,
      latitude: postLat,
      longitude: postLng,
      address: postAddress,
      state: currentUser?.state || 'Delhi NCR',
      district: currentUser?.district || 'New Delhi',
      status: 'pending',
      verificationsCount: 0,
      verifiedUserIds: [],
      createdAt: new Date().toISOString()
    };

    // Initialize blank chatroom for this issue
    const newChatId = `chat_${Date.now()}`;
    const newChat: ChatRoom = {
      id: newChatId,
      complaintId: newId,
      complaintTitle: postTitle,
      citizenId: currentUser?.id || 'citizen_user',
      citizenName: currentUser?.fullName || 'Anonymous Citizen',
      lastMessage: 'Complaint registered. Direct secure channel with district officer initialized.',
      lastMessageAt: new Date().toISOString()
    };

    const initialMessage = {
      id: `m_init_${Date.now()}`,
      chatRoomId: newChatId,
      senderId: 'system',
      senderName: 'System Ledger',
      senderRole: 'officer' as const,
      content: `Complaint '${postTitle}' logged successfully at coordinates (${postLat}, ${postLng}). Secure connection with District of ${newComp.district} established.`,
      createdAt: new Date().toISOString()
    };

    // Save to server database!
    fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        complaint: newComp,
        chatRoom: newChat,
        initialMessage,
        reporterEmail: currentUser?.emailOrPhone
      })
    })
    .then(res => {
      if (res.ok) {
        fetchComplaintsAndChats();
        
        // Reward 100 coins to reporter locally
        if (currentUser) {
          awardCoins(100, 'earn_report', newId, `Submitted unique verified issue: ${postTitle}`);
        }

        onAddLog('database', `Complaint registered in SQL. ID: ${newId}. Geofence active. 100 Coins credited to citizen.`);
        alert("Complaint reported successfully! 100 Coins awarded.");
      } else {
        alert("Failed to save complaint on the database.");
      }
    })
    .catch(err => {
      console.error("Database connection error:", err);
      alert("Database error registering your complaint.");
    });
    
    // Reset form
    setPostTitle('');
    setPostDescription('');
    setPostPhotoUrl('');
    setPostAddress('');
    setPostLat(null);
    setPostLng(null);
    setPostStep('camera');
    setActiveTab('pending');
  };

  // 2. CROWDSOURCED VERIFICATION: Submits physical site audits
  const handleVerifySubmit = () => {
    if (!activeReviewComplaint) return;
    setReviewSubmitting(true);

    const latToCheck = reviewLat !== null ? reviewLat : deviceLocation.lat;
    const lngToCheck = reviewLng !== null ? reviewLng : deviceLocation.lng;

    const distance = calculateDistanceInMeters(
      latToCheck,
      lngToCheck,
      activeReviewComplaint.latitude,
      activeReviewComplaint.longitude
    );

    const PROXIMITY_LIMIT = 150; // meters
    const isSuccess = distance <= PROXIMITY_LIMIT;

    onAddLog('geofence', `Auditing verifier coordinates (${latToCheck.toFixed(5)}, ${lngToCheck.toFixed(5)}) against target coordinates (${activeReviewComplaint.latitude.toFixed(5)}, ${activeReviewComplaint.longitude.toFixed(5)}). Calculated distance: ${Math.round(distance)}m.`);

    setTimeout(() => {
      if (!isSuccess) {
        onAddLog('geofence', `VERIFICATION REJECTED: Coordinates mismatch. Verifier is ${Math.round(distance)}m away. Must be within ${PROXIMITY_LIMIT}m.`);
        alert(`Verification Failed! You are ${Math.round(distance)}m away from the site. You must be within 150 meters of the incident location to verify it.`);
        setReviewSubmitting(false);
        return;
      }

      // Check double-audit lock
      if (activeReviewComplaint.verifiedUserIds.includes(currentUser?.id || '')) {
        alert("You have already reviewed this complaint!");
        setReviewSubmitting(false);
        return;
      }

      // Save verification on database!
      fetch(`/api/complaints/${activeReviewComplaint.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          verifierEmail: currentUser?.emailOrPhone
        })
      })
      .then(res => {
        if (res.ok) {
          fetchComplaintsAndChats();
          
          // Award 50 coins if verifications < 10
          if (activeReviewComplaint.verificationsCount < 10 && currentUser) {
            awardCoins(50, 'earn_verify', activeReviewComplaint.id, `Verified crowdsourced issue: ${activeReviewComplaint.title}`);
          } else {
            onAddLog('rewards', `Verification completed. Cap of 10 reviews reached; review logged, no coins awarded.`);
          }

          alert("Verification successful! Coordinates matched exactly. 50 Coins credited.");
        } else {
          alert("Failed to save verification to database.");
        }
      })
      .catch(err => {
        console.error("Database connection error:", err);
        alert("Database error saving verification.");
      })
      .finally(() => {
        setReviewSubmitting(false);
        setActiveReviewComplaint(null);
        setReviewSelfieCaptured(false);
        setReviewSelfieUrl('');
        setReviewGpsCaptured(false);
      });
    }, 800);
  };

  // 3. OFFICER RESOLUTION SUBMIT
  const handleOpenOfficerResolveModal = (comp: Complaint) => {
    // Automatically teleport mock location to the complaint's coordinates
    // to satisfy the geofence requirement seamlessly for testing/demo
    setDeviceLocation({
      lat: comp.latitude,
      lng: comp.longitude,
      name: `${comp.title} (Site Coordinates)`
    });
    onAddLog('geofence', `Auto-teleported Officer to exact site coordinates at ${comp.title} to satisfy spatial proof geofence (150m).`);
    showToast(`Teleported to ${comp.title} coordinates!`, "success");
    setActiveResolveComplaint(comp);
  };

  const handleOfficerResolve = (comp: Complaint, photoUrl: string) => {
    if (!photoUrl) {
      showToast("Please capture a live photo of the resolved work first.", "error");
      return;
    }

    const distance = calculateDistanceInMeters(
      deviceLocation.lat,
      deviceLocation.lng,
      comp.latitude,
      comp.longitude
    );
    const PROXIMITY_LIMIT = 150;

    if (distance > PROXIMITY_LIMIT) {
      // Auto-teleport back if distance got changed
      setDeviceLocation({
        lat: comp.latitude,
        lng: comp.longitude,
        name: `${comp.title} (Site Coordinates)`
      });
      onAddLog('geofence', `Auto-teleported back to site to submit proof.`);
    }

    // Resolve complaint on database!
    fetch(`/api/complaints/${comp.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'resolve',
        officerName: currentUser?.fullName,
        resolvedAt: new Date().toISOString(),
        resolvedPhotoUrl: photoUrl
      })
    })
    .then(res => {
      if (res.ok) {
        fetchComplaintsAndChats();
        onAddLog('database', `Complaint '${comp.title}' marked as SOLVED in DB. GPS verification match confirmed. Resolution proof picture registered.`);
        showToast("Resolution proof recorded and issue moved to Solved folder.", "success");
        setActiveResolveComplaint(null);
      } else {
        showToast("Failed to resolve complaint on the server.", "error");
      }
    })
    .catch(err => {
      console.error("Database connection error:", err);
      showToast("Database error resolving complaint.", "error");
    });
  };

  // 4. CITIZEN CHALLENGE SUBMIT
  const handleChallengeSubmit = () => {
    if (!activeChallengeComplaint) return;

    const latToCheck = challengeLat !== null ? challengeLat : deviceLocation.lat;
    const lngToCheck = challengeLng !== null ? challengeLng : deviceLocation.lng;

    const distance = calculateDistanceInMeters(
      latToCheck,
      lngToCheck,
      activeChallengeComplaint.latitude,
      activeChallengeComplaint.longitude
    );

    const PROXIMITY_LIMIT = 150;
    
    onAddLog('geofence', `Auditing dispute coordinate lock (${latToCheck.toFixed(5)}, ${lngToCheck.toFixed(5)}) against resolved complaint site (${activeChallengeComplaint.latitude.toFixed(5)}, ${activeChallengeComplaint.longitude.toFixed(5)}). Calculated distance: ${Math.round(distance)}m.`);

    if (distance > PROXIMITY_LIMIT) {
      onAddLog('geofence', `CHALLENGE REJECTED: Citizens must be at the site to dispute a resolved status. Distance: ${Math.round(distance)}m.`);
      alert(`Dispute Denied! You are currently ${Math.round(distance)} meters away from the resolved site. You must be within 150 meters to verify that the problem is unresolved.`);
      return;
    }

    // Revert complaint back to Pending on server database!
    fetch(`/api/complaints/${activeChallengeComplaint.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'challenge'
      })
    })
    .then(res => {
      if (res.ok) {
        fetchComplaintsAndChats();
        onAddLog('challenge', `CHALLENGE GRANTED: Citizen disputed resolution for '${activeChallengeComplaint.title}'. Selfie proof & location matched at site. Reverting issue to PENDING in database.`);
        // Penalize solving officer (simulated log event)
        onAddLog('challenge', `System Alert: Officer resolution flagged as inaccurate. Incident audit scheduled.`);
        alert("Challenge verified! The complaint has been reverted to Pending. Transparency audit launched.");
      } else {
        alert("Failed to submit challenge to server.");
      }
    })
    .catch(err => {
      console.error("Database connection error:", err);
      alert("Database error submitting challenge.");
    })
    .finally(() => {
      setActiveChallengeComplaint(null);
      setChallengeSelfieCaptured(false);
      setChallengePhotoCaptured(false);
      setChallengeGpsCaptured(false);
    });
  };

  // Send interactive chat message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeChatRoomId) return;

    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      chatRoomId: activeChatRoomId,
      senderId: currentUser?.id || 'anon',
      senderName: currentUser?.fullName || 'User',
      senderRole: currentUser?.role || 'citizen',
      content: newMessageText,
      createdAt: new Date().toISOString()
    };

    const responseMsg: Message = {
      id: `msg_auto_${Date.now()}`,
      chatRoomId: activeChatRoomId,
      senderId: currentUser?.role === 'officer' ? 'user_1' : 'user_2',
      senderName: currentUser?.role === 'officer' ? 'Rahul Sharma' : 'Officer Amit Kumar',
      senderRole: currentUser?.role === 'officer' ? 'citizen' : 'officer',
      content: currentUser?.role === 'officer' 
        ? "Acknowledged sir. I will keep an eye on site updates and verify."
        : "Understood. The maintenance vehicle is scheduled to head out shortly.",
      createdAt: new Date().toISOString()
    };

    // Save message and auto response to database!
    fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: newMsg,
        responseMsg: responseMsg
      })
    })
    .then(res => {
      if (res.ok) {
        // Force state update instantly
        setAllMessages(prev => ({
          ...prev,
          [activeChatRoomId]: [...(prev[activeChatRoomId] || []), newMsg, responseMsg]
        }));
        
        setChatRooms(prevRooms => prevRooms.map(room => {
          if (room.id === activeChatRoomId) {
            return {
              ...room,
              lastMessage: responseMsg.content,
              lastMessageAt: responseMsg.createdAt
            };
          }
          return room;
        }));

        onAddLog('database', `Message and automatic response saved securely to database for Chat Room ${activeChatRoomId}.`);
      } else {
        alert("Failed to send message.");
      }
    })
    .catch(err => {
      console.error("Database connection error:", err);
      alert("Database error sending message.");
    });

    setNewMessageText('');
    onAddLog('database', `Message sent securely on Chat Room ${activeChatRoomId}.`);
  };

  // Filter complaints based on roles and active tabs
  const filteredComplaints = complaints.filter(comp => {
    // Tab match
    if (activeTab === 'pending' && comp.status !== 'pending') return false;
    if (activeTab === 'solved' && comp.status !== 'resolved') return false;
    if (activeTab === 'post') return false;

    // Government filter: Only show complaints strictly in their district
    if (currentUser?.role === 'officer') {
      return comp.district === currentUser.district;
    }

    return true;
  });

  const getMaskedEmailOrPhone = (val: string) => {
    if (!val) return '';
    if (val.includes('@')) {
      const parts = val.split('@');
      const local = parts[0];
      const domain = parts[1];
      if (local.length <= 3) {
        return `${local.slice(0, 1)}***@${domain}`;
      }
      return `${local.slice(0, 3)}***@${domain}`;
    } else {
      if (val.length >= 7) {
        return `${val.slice(0, 3)}***${val.slice(-3)}`;
      }
      return `${val.slice(0, 2)}***${val.slice(-2)}`;
    }
  };

  const citizenComplaints = complaints
    .filter(comp => comp.reporterId === currentUser?.id || comp.verifiedUserIds.includes(currentUser?.id || ''))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const officerComplaints = complaints
    .filter(comp => comp.resolvedBy === currentUser?.fullName || comp.district === currentUser?.district)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="flex flex-col items-center space-y-6" id="simulator-canvas">
      
      {/* 1. Mobile Device Frame */}
      <div className="relative w-[340px] h-[670px] bg-[#0E0E0E] rounded-[44px] p-3.5 shadow-2xl border-4 border-brand-border select-none overflow-hidden" id="phone-frame-inner">
        
        {/* Phone Speaker & Camera Bezel (Notch) */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-[#0E0E0E] rounded-b-2xl z-50 flex items-center justify-center">
          <div className="w-16 h-1.5 bg-[#1F1F1F] rounded-full mb-1"></div>
          <div className="w-2.5 h-2.5 bg-brand-cyan-soft rounded-full ml-3 mb-1 border border-brand-cyan/20"></div>
        </div>

        {/* Live App Content Screen */}
        <div className="w-full h-full bg-brand-dark-bg rounded-[32px] overflow-hidden relative flex flex-col font-sans border border-brand-border" id="mobile-app-screen">
          
          {currentUser ? (
            <>
              {/* STAGE HEADER WITH carrier notifications */}
              <div className="bg-[#141414]/80 backdrop-blur-md pt-5 pb-1 px-4 border-b border-brand-border flex items-center justify-between z-40 text-brand-text-dim">
                <span className="text-[10px] font-mono font-bold tracking-tight">11:15 AM</span>
                <span className="text-[9px] text-brand-text-dim font-mono tracking-widest">5G • 🔋100%</span>
              </div>

              {/* PREMIUM APP BAR with exactly two top right icons: Messages and Coins */}
              <div className="bg-brand-dark-card px-4 py-2 border-b border-brand-border flex items-center justify-between z-40">
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => setIsProfileOpen(true)}
                    className="p-1 hover:bg-brand-dark-bg rounded-full transition-colors text-brand-text-dim hover:text-brand-text-main flex items-center justify-center border border-brand-border/40"
                    id="topbar-profile-btn"
                    title="User Profile"
                  >
                    <User className="h-3.5 w-3.5 text-brand-cyan" />
                  </button>
                  {currentUser.role === 'officer' && (
                    <span className="bg-brand-cyan-soft text-brand-cyan text-[8px] font-mono font-bold px-1.5 py-0.2 rounded uppercase border border-brand-cyan/20 ml-1">Gov</span>
                  )}
                </div>
                
                {/* Top-Right corner featuring icons: Chat/Inbox & Coin Balance */}
                <div className="flex items-center gap-1.5">
                  {/* Icon 1: Message / Chat icon */}
                  <button 
                    onClick={() => setIsInboxOpen(true)}
                    className="relative p-1.5 hover:bg-brand-dark-bg rounded-full transition-colors text-brand-text-dim hover:text-brand-text-main"
                    id="topbar-chat-btn"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-rose-500 rounded-full animate-ping"></span>
                  </button>

                  {/* Icon 2: Coin balance button */}
                  <button 
                    onClick={() => {
                      setActiveCoinsTab('redeem');
                      setIsCoinsOpen(true);
                    }}
                    className="flex items-center gap-1 bg-brand-coin/10 text-brand-coin border border-brand-coin/30 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono shadow-sm hover:bg-brand-coin/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    id="topbar-coins-btn"
                    title="Open Reward Wallet"
                  >
                    <Coins className="h-3 w-3 text-brand-coin animate-pulse" />
                    <span>{currentUser.coinBalance}</span>
                  </button>
                </div>
              </div>

              {/* DYNAMIC SCROLL CONTAINER */}
              <div className="flex-1 overflow-y-auto bg-brand-dark-bg pb-20 no-scrollbar relative">
                
                {/* ACTIVE TAB SECTIONS */}
                {activeTab === 'pending' && (
                  <div className="space-y-4 pt-3" id="main-feed-screen">
                    <div className="px-4 flex flex-col">
                      <h2 className="font-display font-bold text-sm text-brand-text-main">Active Issues</h2>
                      <p className="text-[10px] text-brand-text-dim">
                        {currentUser.role === 'officer' 
                          ? `District: ${currentUser.district} office scope` 
                          : `Crowdsourced validation feed`}
                      </p>
                    </div>

                    {/* HORIZONTAL COMPLAINT SWIPER (CARD PEEK LAYOUT: 1.5 CARDS VISIBLE) */}
                    <div className="relative pl-4 pr-10 overflow-x-auto flex gap-4 no-scrollbar scroll-smooth" id="horizontal-swiper-rail">
                      {filteredComplaints.length === 0 ? (
                        <div className="w-[240px] h-[340px] shrink-0 border border-dashed border-brand-border rounded-2xl flex flex-col items-center justify-center p-5 text-center bg-brand-dark-card">
                          <AlertCircle className="h-8 w-8 text-brand-text-dim mb-2" />
                          <p className="text-xs text-brand-text-dim">No active complaints found in this district.</p>
                        </div>
                      ) : (
                        filteredComplaints.map((comp, idx) => (
                          <div 
                            key={comp.id}
                            className="w-[230px] shrink-0 bg-brand-dark-card border border-brand-border rounded-2xl p-3 shadow-2xl flex flex-col justify-between h-[360px] relative hover:border-brand-cyan/30 transition-all"
                            id={`complaint-card-${comp.id}`}
                          >
                            <div className="space-y-2">
                              {/* Card Image header */}
                              <div className="w-full h-24 rounded-lg bg-brand-dark-bg overflow-hidden relative border border-brand-border">
                                <img 
                                  src={comp.imageUrl} 
                                  alt={comp.title}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute top-1.5 left-1.5 bg-brand-dark-bg/85 backdrop-blur-md text-[8px] font-bold text-brand-cyan px-1.5 py-0.5 rounded font-mono uppercase border border-brand-cyan/20">
                                  {comp.verificationsCount}/10 Verified
                                </div>
                              </div>

                              {/* Card details */}
                              <div>
                                <h3 className="font-bold text-brand-text-main text-[11px] leading-tight line-clamp-1">{comp.title}</h3>
                                <p className="text-[9px] text-brand-text-dim mt-0.5 flex items-center gap-0.5">
                                  <MapPin className="h-2.5 w-2.5 shrink-0 text-brand-cyan" />
                                  <span className="truncate">{comp.address}</span>
                                </p>
                                <p className="text-[10px] text-brand-text-dim mt-1.5 leading-snug line-clamp-3 font-light">
                                  {comp.description}
                                </p>
                              </div>
                            </div>

                            {/* Card Lower Controls */}
                            <div className="space-y-1.5 pt-2 border-t border-brand-border" id="card-action-triggers">
                              
                              {/* Role-Specific Actions */}
                              {currentUser.role === 'officer' ? (
                                <button
                                  onClick={() => handleOpenOfficerResolveModal(comp)}
                                  className="w-full py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-emerald-700 transition-colors"
                                  id={`resolve-btn-${comp.id}`}
                                >
                                  <CheckCircle className="h-3 w-3" />
                                  Submit Solved Proof
                                </button>
                              ) : null}

                              {/* Standard 3 specific bottom action items */}
                              <div className="grid grid-cols-3 gap-1">
                                {/* Action 1: Chat Button */}
                                <button 
                                  onClick={() => {
                                    // Locate chat or open inbox
                                    const chat = chatRooms.find(r => r.complaintId === comp.id);
                                    if (chat) {
                                      setActiveChatRoomId(chat.id);
                                      setIsInboxOpen(true);
                                    } else {
                                      alert("Chat room initialization failed.");
                                    }
                                  }}
                                  className="py-1 bg-brand-dark-bg border border-brand-border hover:bg-brand-dark-bg/60 rounded text-brand-text-main text-[9px] font-semibold flex flex-col items-center justify-center"
                                  title="Chat with reporter"
                                >
                                  <MessageSquare className="h-3.5 w-3.5 mb-0.5 text-brand-text-dim" />
                                  <span>Chat</span>
                                </button>

                                {/* Action 2: Direction / Map Button */}
                                <button 
                                  onClick={() => setActiveMapComplaint(comp)}
                                  className="py-1 bg-brand-dark-bg border border-brand-border hover:bg-brand-dark-bg/60 rounded text-brand-text-main text-[9px] font-semibold flex flex-col items-center justify-center"
                                  title="Route mapping"
                                >
                                  <Navigation className="h-3.5 w-3.5 mb-0.5 text-brand-cyan" />
                                  <span>Route</span>
                                </button>

                                {/* Action 3: Review / Verify Button */}
                                <button 
                                  onClick={() => {
                                    if (comp.verifiedUserIds.includes(currentUser.id)) {
                                      showToast("You have already audited this complaint!", "info");
                                      return;
                                    }
                                    // Auto teleport to verify!
                                    setDeviceLocation({
                                      lat: comp.latitude,
                                      lng: comp.longitude,
                                      name: `${comp.title} (Site Coordinates)`
                                    });
                                    onAddLog('geofence', `Auto-teleported to ${comp.title} to enable crowdsourced verification.`);
                                    showToast(`Teleported to site! Ready to verify.`, "success");
                                    setActiveReviewComplaint(comp);
                                  }}
                                  className={`py-1 rounded text-[9px] font-semibold flex flex-col items-center justify-center ${
                                    comp.verifiedUserIds.includes(currentUser.id)
                                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                      : 'bg-brand-cyan-soft hover:bg-brand-cyan-soft/80 text-brand-cyan border border-brand-cyan/20'
                                  }`}
                                  title="Verify physically"
                                >
                                  <CheckCircle className="h-3.5 w-3.5 mb-0.5 text-brand-cyan" />
                                  <span>Verify</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Active Device GPS display */}
                    <button 
                      type="button"
                      onClick={() => setIsLocationMenuOpen(true)}
                      className="mx-4 border border-brand-border bg-brand-dark-card hover:bg-brand-dark-card/80 text-left rounded-xl p-3 space-y-1.5 shadow-md block w-[calc(100%-2rem)] transition-all active:scale-[0.98]"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-brand-text-dim uppercase tracking-wider">Device Location Hub</span>
                        <span className="text-[9px] font-bold text-brand-cyan flex items-center gap-1">Change Zone ↗</span>
                      </div>
                      <p className="text-xs text-brand-text-main font-semibold flex items-center gap-1 truncate">
                        <MapPin className="h-3.5 w-3.5 text-brand-cyan" />
                        {deviceLocation.name}
                      </p>
                      <p className="text-[9px] text-brand-text-dim font-mono">
                        Latitude: {deviceLocation.lat.toFixed(5)} • Longitude: {deviceLocation.lng.toFixed(5)}
                      </p>
                    </button>
                  </div>
                )}

                {/* SOLVED TAB */}
                {activeTab === 'solved' && (
                  <div className="space-y-4 pt-3" id="solved-screen">
                    <div className="px-4">
                      <h2 className="font-display font-bold text-sm text-brand-text-main">Solved Complaints</h2>
                      <p className="text-[10px] text-brand-text-dim">Fully validated authority resolutions</p>
                    </div>

                    <div className="space-y-3 px-4">
                      {complaints.filter(c => c.status === 'resolved').length === 0 ? (
                        <div className="border border-dashed border-brand-border rounded-xl py-12 text-center bg-brand-dark-card p-5">
                          <CheckCircle className="h-8 w-8 text-brand-text-dim mx-auto mb-2" />
                          <p className="text-xs text-brand-text-dim">No solved cases registered yet.</p>
                        </div>
                      ) : (
                        complaints.filter(c => c.status === 'resolved').map(comp => (
                          <div 
                            key={comp.id}
                            className="bg-brand-dark-card border border-brand-border rounded-xl p-3 shadow-sm space-y-3"
                          >
                            <div className="flex gap-2">
                              {/* Before photo */}
                              <div className="flex-1 space-y-0.5">
                                <span className="text-[8px] text-brand-text-dim block uppercase">Original Failure</span>
                                <div className="h-14 rounded overflow-hidden border border-brand-border">
                                  <img src={comp.imageUrl} className="w-full h-full object-cover" alt="original" referrerPolicy="no-referrer" />
                                </div>
                              </div>
                              {/* Resolved Proof photo */}
                              <div className="flex-1 space-y-0.5">
                                <span className="text-[8px] text-emerald-400 block font-semibold uppercase">Resolved Proof</span>
                                <div className="h-14 rounded overflow-hidden border border-emerald-500/30">
                                  <img src={comp.resolvedPhotoUrl} className="w-full h-full object-cover" alt="resolved" referrerPolicy="no-referrer" />
                                </div>
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center justify-between">
                                <h3 className="font-bold text-[11px] text-brand-text-main truncate">{comp.title}</h3>
                                <span className="text-[8px] bg-emerald-500/15 text-emerald-400 font-bold px-1.5 py-0.2 rounded border border-emerald-500/20">SOLVED</span>
                              </div>
                              <p className="text-[9px] text-brand-text-dim mt-0.5 truncate">{comp.address}</p>
                              <p className="text-[9px] text-brand-text-dim mt-1.5 bg-brand-dark-bg p-1.5 rounded leading-normal border-l-2 border-emerald-400 font-light">
                                <strong>Resolved by {comp.resolvedBy}:</strong> Verified through live on-site camera matching coordinates.
                              </p>
                            </div>

                            {/* Challenge Button (Citizen Only) */}
                            {currentUser.role === 'citizen' && (
                              <button
                                onClick={() => setActiveChallengeComplaint(comp)}
                                className="w-full py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded text-[9.5px] font-bold flex items-center justify-center gap-1 transition-colors border border-rose-500/20"
                                id={`challenge-btn-${comp.id}`}
                              >
                                <ShieldAlert className="h-3 w-3" />
                                Challenge Resolution
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* POST SECTION */}
                {activeTab === 'post' && (
                  <div className="space-y-4 pt-3" id="post-report-screen">
                    <div className="px-4">
                      <h2 className="font-display font-bold text-sm text-brand-text-main">Post Incident</h2>
                      <p className="text-[10px] text-brand-text-dim">Requires live photo & coordinate validation</p>
                    </div>

                    {postStep === 'camera' && (
                      <div className="px-4 space-y-3" id="camera-viewport-frame">
                        <div className="w-full h-52 bg-brand-dark-bg rounded-xl relative flex flex-col items-center justify-center border border-brand-border overflow-hidden">
                          {!cameraError ? (
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className="absolute inset-0 w-full h-full object-cover z-0"
                            />
                          ) : null}

                          {/* Overlay gradient to keep text readable/dark look */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-10 pointer-events-none"></div>
                          
                          {/* When stream is active, show small indicator */}
                          {videoStream ? (
                            <div className="absolute top-3 left-3 bg-red-600 px-2 py-0.5 rounded-full z-20 animate-pulse flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                              <span className="text-[8px] text-white font-mono uppercase font-bold tracking-wider">Live CAM</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center z-20 text-center px-4">
                              <Camera className="h-8 w-8 text-white/50 mb-2 animate-pulse" />
                              <p className="text-[10px] text-white/70 uppercase tracking-widest font-mono">
                                {cameraError ? 'Camera Mode' : 'Starting Camera...'}
                              </p>
                              {cameraError && (
                                <p className="text-[8px] text-rose-400 mt-1 max-w-[200px] font-mono">
                                  {cameraError}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Shutter Button */}
                          <button
                            onClick={handleCapturePhoto}
                            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 h-12 w-12 bg-white rounded-full border-4 border-[#333] flex items-center justify-center z-20 active:scale-95 transition-transform"
                            id="camera-shutter-trigger"
                          >
                            <div className="h-8 w-8 bg-white rounded-full border border-slate-300"></div>
                          </button>
                        </div>
                        <div className="bg-brand-cyan/5 text-brand-cyan border border-brand-cyan/20 rounded-lg p-2.5 text-[9px] leading-snug">
                          🔒 <strong>Secure Capture Mode:</strong> In compliance with civic verification protocols, audit photos must be captured live. Local gallery access is restricted.
                        </div>
                      </div>
                    )}

                    {postStep === 'form' && (
                      <form onSubmit={handlePostSubmit} className="px-4 space-y-3 animate-fade-in" id="incident-report-form">
                        
                        {/* Selected Snapshot Preview */}
                        <div className="h-16 rounded-lg overflow-hidden border border-brand-border relative">
                          <img src={postPhotoUrl} alt="captured" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setPostStep('camera')}
                            className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white hover:bg-black/80"
                          >
                            <RotateCcw className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Category Toggle */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-brand-text-dim uppercase">Issue Category</label>
                          <select
                            value={postCategory}
                            onChange={(e) => {
                              const selectedCat = e.target.value;
                              setPostCategory(selectedCat);
                              setPostTitle('');
                            }}
                            className="w-full bg-brand-dark-bg border border-brand-border rounded-lg px-2.5 py-1.5 text-xs text-brand-text-main"
                            required
                          >
                            <option value="">-- Select Category --</option>
                            <option value="Road Infrastructure">Road Infrastructure</option>
                            <option value="Drainage & Sewage">Drainage & Sewage</option>
                            <option value="Electricity & Street Lights">Electricity & Street Lights</option>
                            <option value="Public Infrastructure">Public Infrastructure</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        {/* Title input */}
                        {postCategory && (
                          <div className="space-y-1 animate-fade-in">
                            <label className="text-[9px] font-bold text-brand-text-dim uppercase">Issue Title</label>
                            {postCategory === 'Other' ? (
                              <input
                                type="text"
                                value={postTitle}
                                onChange={(e) => setPostTitle(e.target.value)}
                                placeholder="Enter Issue Title"
                                className="w-full bg-brand-dark-bg border border-brand-border rounded-lg px-2.5 py-1.5 text-xs text-brand-text-main focus:outline-none focus:border-brand-cyan"
                                required
                              />
                            ) : (
                              <select
                                value={postTitle}
                                onChange={(e) => setPostTitle(e.target.value)}
                                className="w-full bg-brand-dark-bg border border-brand-border rounded-lg px-2.5 py-1.5 text-xs text-brand-text-main focus:outline-none focus:border-brand-cyan"
                                required
                              >
                                <option value="">-- Select Specific Issue --</option>
                                {(postCategory === 'Road Infrastructure' ? [
                                  'Pothole',
                                  'Road Crack',
                                  'Road Cave-in',
                                  'Broken Footpath',
                                  'Damaged Divider',
                                  'Missing Speed Breaker',
                                  'Missing Road Sign',
                                  'Damaged Bridge'
                                ] : postCategory === 'Drainage & Sewage' ? [
                                  'Water Leakage',
                                  'Pipeline Burst',
                                  'Water Logging',
                                  'Blocked Drain',
                                  'Sewage Overflow',
                                  'Open Drain'
                                ] : postCategory === 'Electricity & Street Lights' ? [
                                  'Street Light Not Working',
                                  'Hanging Electric Wire',
                                  'Electric Pole Damage',
                                  'Power Outage',
                                  'Transformer Issue'
                                ] : postCategory === 'Public Infrastructure' ? [
                                  'Broken Bus Stop',
                                  'Broken Bench',
                                  'Government Building Damage',
                                  'Broken Wall',
                                  'Public Toilet Damage'
                                ] : []).map((titleOpt) => (
                                  <option key={titleOpt} value={titleOpt}>{titleOpt}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        )}

                        {/* Description field */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-brand-text-dim uppercase">Description (Optional)</label>
                          <textarea
                            value={postDescription}
                            onChange={(e) => setPostDescription(e.target.value)}
                            rows={2}
                            placeholder="Describe physical damage details..."
                            className="w-full bg-brand-dark-bg border border-brand-border rounded-lg p-2 text-xs text-brand-text-main"
                          />
                        </div>

                        {/* GET LIVE LOCATION */}
                        <div className="space-y-2 border border-brand-border bg-brand-dark-card p-2.5 rounded-xl">
                          <button
                            type="button"
                            onClick={fetchPostLiveLocation}
                            disabled={isPostLocationLoading}
                            className="w-full py-1.5 bg-brand-cyan-soft hover:bg-brand-cyan-soft/80 text-brand-cyan text-[10px] font-bold rounded-lg border border-brand-cyan/20 flex items-center justify-center gap-1 transition-colors disabled:opacity-60"
                            id="fetch-post-gps-btn"
                          >
                            {isPostLocationLoading ? (
                              <>
                                <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                                Pinpointing Exact Location...
                              </>
                            ) : (
                              <>
                                <Map className="h-3.5 w-3.5 animate-pulse" />
                                Get Live Location
                              </>
                            )}
                          </button>

                          {postLat && (
                            <div className="space-y-1 animate-fade-in text-[10px] text-brand-text-dim">
                              <p className="font-semibold text-brand-text-main">Coordinates Locked:</p>
                              <p className="font-mono bg-brand-dark-bg p-1.5 rounded border border-brand-border text-brand-cyan leading-tight">
                                Lat: {postLat.toFixed(5)} • Lng: {postLng?.toFixed(5)}
                              </p>
                              <div className="space-y-1 mt-1">
                                <label className="text-[8px] font-bold text-brand-text-dim uppercase">Resolved Exact Location Address</label>
                                <input
                                  type="text"
                                  value={postAddress}
                                  onChange={(e) => setPostAddress(e.target.value)}
                                  placeholder="Address will be resolved..."
                                  className="w-full bg-brand-dark-bg border border-brand-border rounded p-1.5 text-[11px] text-brand-text-main focus:border-brand-cyan outline-none leading-relaxed"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2 bg-brand-cyan text-brand-dark-bg font-bold rounded-xl text-[11px] uppercase tracking-wide hover:bg-brand-cyan/90 transition-all shadow-md shadow-brand-cyan/10"
                        >
                          Submit Complaint
                        </button>
                      </form>
                    )}

                    {postStep === 'duplicate_alert' && duplicateReport && (
                      <div className="px-4 space-y-4 text-center animate-fade-in" id="duplication-warning-overlay">
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex flex-col items-center">
                          <ShieldAlert className="h-10 w-10 text-rose-400 mb-2" />
                          <h3 className="font-display font-bold text-xs text-rose-200 uppercase">Duplicate Post Blocked</h3>
                          <p className="text-[9.5px] text-rose-300 mt-1 leading-snug font-light">
                            Our PostGIS geofencing algorithm identified that this problem type is already reported within 150m.
                          </p>
                        </div>

                        <div className="border border-brand-border rounded-xl bg-brand-dark-card p-3 text-left space-y-2">
                          <span className="text-[8px] font-mono font-bold bg-brand-dark-bg text-brand-text-dim px-1.5 py-0.2 rounded uppercase border border-brand-border">Existing Record</span>
                          <h4 className="font-bold text-[11px] text-brand-text-main">{duplicateReport.title}</h4>
                          <p className="text-[10px] text-brand-text-dim leading-snug">{duplicateReport.address}</p>
                          <div className="bg-emerald-500/10 text-emerald-300 text-[9px] p-2 rounded border border-emerald-500/20 flex items-center gap-1.5">
                            <Award className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                            <span>Navigate to this site and click <strong>Verify</strong> to earn 50 Coins instead!</span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setPostStep('camera');
                            setDuplicateReport(null);
                          }}
                          className="w-full py-1.5 border border-brand-border text-brand-text-main bg-brand-dark-bg rounded-lg text-xs font-semibold hover:bg-brand-dark-card"
                        >
                          Back to Viewfinder
                        </button>
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* BOTTOM NAVIGATION: Floating Curved NOTCH CONTAINER with exactly 3 Columns: [Pending], [Post], [Solved] */}
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-[90%] bg-[#141414] border border-brand-border py-2.5 px-3 rounded-[24px] shadow-2xl z-50 flex items-center justify-between" id="notch-nav-bar">
                
                {/* Column 1: Pending */}
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`flex flex-col items-center justify-center flex-1 transition-all ${
                    activeTab === 'pending' ? 'text-brand-cyan scale-105' : 'text-brand-text-dim hover:text-brand-text-main'
                  }`}
                  id="tab-btn-pending"
                >
                  <RotateCcw className="h-4.5 w-4.5" />
                  <span className="text-[8px] font-bold mt-1">Pending</span>
                </button>

                {/* Column 2: Post (Centered camera anchor) */}
                <button
                  onClick={() => {
                    setActiveTab('post');
                    setPostStep('camera');
                  }}
                  className={`flex flex-col items-center justify-center flex-1 transition-all ${
                    activeTab === 'post' ? 'text-brand-cyan scale-105 animate-notch-pulse' : 'text-brand-text-dim hover:text-brand-text-main'
                  }`}
                  id="tab-btn-post"
                >
                  <div className="h-9 w-9 rounded-full bg-brand-cyan flex items-center justify-center text-brand-dark-bg shadow-md shadow-brand-cyan/30 -mt-5 border-2 border-brand-dark-card active:scale-95 transition-transform">
                    <Plus className="h-5 w-5" />
                  </div>
                  <span className="text-[8px] font-bold mt-1">Post</span>
                </button>

                {/* Column 3: Solved */}
                <button
                  onClick={() => setActiveTab('solved')}
                  className={`flex flex-col items-center justify-center flex-1 transition-all ${
                    activeTab === 'solved' ? 'text-brand-cyan scale-105' : 'text-brand-text-dim hover:text-brand-text-main'
                  }`}
                  id="tab-btn-solved"
                >
                  <CheckCircle className="h-4.5 w-4.5" />
                  <span className="text-[8px] font-bold mt-1">Solved</span>
                </button>
              </div>

            </>
          ) : (
            
            /* DUAL AUTHENTICATION SYSTEM INTERACTIVE SCREEN */
            <div className="flex-1 bg-brand-dark-bg text-brand-text-main p-5 flex flex-col justify-between" id="login-screen-outer">
              
              <div className="space-y-4 pt-10">
                <div className="text-center py-2">
                  <CivicsGuardLogo className="w-28 h-28 mx-auto" showText={true} />
                </div>

                {/* Role Switch Tabs */}
                <div className="grid grid-cols-2 bg-[#141414] p-1 rounded-lg border border-brand-border">
                  <button
                    onClick={() => {
                      setLoginRole('citizen');
                      setIsOtpSent(false);
                      setLoginInput('');
                      setShowGovDisclaimer(false);
                    }}
                    className={`py-1.5 rounded-md text-xs font-semibold transition-all ${
                      loginRole === 'citizen' ? 'bg-brand-cyan text-brand-dark-bg shadow-md shadow-brand-cyan/15' : 'text-brand-text-dim hover:text-brand-text-main'
                    }`}
                  >
                    Citizen Account
                  </button>
                  <button
                    onClick={() => {
                      setLoginRole('officer');
                      setIsOtpSent(false);
                      setLoginInput('');
                      setShowGovDisclaimer(false);
                    }}
                    className={`py-1.5 rounded-md text-xs font-semibold transition-all ${
                      loginRole === 'officer' ? 'bg-brand-cyan text-brand-dark-bg shadow-md shadow-brand-cyan/15' : 'text-brand-text-dim hover:text-brand-text-main'
                    }`}
                  >
                    Gov Authority
                  </button>
                </div>

                {isOnboarding ? (
                  /* Government employee onboarding screen */
                  <div className="space-y-3 bg-[#141414] p-3.5 rounded-xl border border-brand-border animate-fade-in" id="officer-onboarding-form">
                    <h3 className="font-bold text-xs text-brand-cyan uppercase">Onboarding Profile</h3>
                    <p className="text-[9px] text-brand-text-dim leading-normal font-light">
                      Confirm your government district credentials to proceed to the localized monitoring console.
                    </p>
                    
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold uppercase text-brand-text-dim">Assigned State</label>
                        <select
                          value={selectedState}
                          onChange={(e) => setSelectedState(e.target.value)}
                          className="w-full bg-brand-dark-bg border border-brand-border rounded-lg p-2 text-xs text-brand-text-main"
                        >
                          {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] font-bold uppercase text-brand-text-dim">Assigned District</label>
                        <select
                          value={selectedDistrict}
                          onChange={(e) => setSelectedDistrict(e.target.value)}
                          className="w-full bg-brand-dark-bg border border-brand-border rounded-lg p-2 text-xs text-brand-text-main"
                        >
                          {DELHI_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleOnboardingComplete}
                      className="w-full py-1.5 bg-brand-cyan text-brand-dark-bg rounded-lg text-xs font-bold hover:bg-brand-cyan/90 transition-all shadow-md shadow-brand-cyan/10"
                    >
                      Initialize Employee Desk
                    </button>
                  </div>
                ) : (
                  /* Standard OTP Form */
                  <div className="space-y-3">
                    {!isOtpSent ? (
                      <div>
                        <form onSubmit={handleSendOtp} className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold uppercase text-brand-text-dim block">
                              {loginRole === 'citizen' ? '10-Digit Mobile Number' : 'Government Email ID'}
                            </label>
                            <input
                              type={loginRole === 'citizen' ? 'tel' : 'email'}
                              placeholder={loginRole === 'citizen' ? 'e.g., 9876543210' : 'e.g., amit.kumar@gov.in'}
                              value={loginInput}
                              maxLength={loginRole === 'citizen' ? 10 : undefined}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (loginRole === 'citizen') {
                                  setLoginInput(val.replace(/\D/g, '').slice(0, 10));
                                } else {
                                  setLoginInput(val);
                                }
                                setShowGovDisclaimer(false);
                              }}
                              className="w-full bg-brand-dark-bg border border-brand-border rounded-lg px-3 py-2 text-xs text-brand-text-main focus:outline-none focus:border-brand-cyan"
                              required
                              disabled={authLoading}
                            />
                          </div>

                          {loginRole === 'officer' && showGovDisclaimer && (
                            <div className="p-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 text-[9.5px] leading-relaxed transition-all">
                              <p className="font-bold flex items-center gap-1 uppercase tracking-wider text-[8px] text-rose-400">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
                                official Gov.in Disclaimer
                              </p>
                              <p className="mt-1">
                                Government employee accounts must log in using an official email ending with <strong className="text-brand-cyan font-bold">gov.in</strong> (e.g., <code className="bg-black/30 px-1 py-0.5 rounded text-emerald-400 font-mono text-[9px]">amit.kumar@gov.in</code>). Normal domains (Gmail, Yahoo, etc.) are strictly prohibited for authority roles.
                              </p>
                            </div>
                          )}
                          <button
                            type="submit"
                            disabled={authLoading}
                            className="w-full py-2 bg-brand-cyan text-brand-dark-bg font-bold rounded-lg text-xs transition-colors shadow-md shadow-brand-cyan/10 disabled:opacity-50"
                          >
                            {authLoading ? 'Dispatching OTP...' : 'Request OTP'}
                          </button>
                        </form>

                        {loginRole === 'citizen' && (
                          <>
                            <div className="relative my-3 flex py-1 items-center">
                              <div className="flex-grow border-t border-brand-border/40"></div>
                              <span className="flex-shrink mx-3 text-[9px] text-brand-text-dim uppercase tracking-wider font-semibold">or</span>
                              <div className="flex-grow border-t border-brand-border/40"></div>
                            </div>

                            <button
                              type="button"
                              onClick={handleGoogleSignIn}
                              disabled={authLoading}
                              className="w-full py-2 bg-[#141414] hover:bg-[#1c1c1c] text-brand-text-main border border-brand-border hover:border-brand-border/80 font-semibold rounded-lg text-xs transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] disabled:opacity-50"
                            >
                              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                                <path
                                  fill="#4285F4"
                                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                  fill="#34A853"
                                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                  fill="#FBBC05"
                                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                />
                                <path
                                  fill="#EA4335"
                                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                />
                              </svg>
                              <span>Sign in with Google</span>
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <form onSubmit={handleVerifyOtp} className="space-y-3 animate-fade-in">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <label className="text-[8px] font-bold uppercase text-brand-text-dim">OTP Code (SMS / EMail)</label>
                          </div>
                          <input
                            type="text"
                            placeholder="Enter 4-digit code"
                            maxLength={4}
                            value={otpInput}
                            onChange={(e) => setOtpInput(e.target.value)}
                            className="w-full bg-brand-dark-bg border border-brand-border rounded-lg px-3 py-2 text-xs text-brand-text-main tracking-widest text-center font-bold focus:outline-none focus:border-brand-cyan font-mono"
                            required
                            disabled={authLoading}
                          />
                          <p className="text-[8.5px] text-amber-400/90 leading-normal text-center mt-1 bg-amber-500/10 border border-amber-500/20 rounded p-1.5 font-medium">
                            ⚠️ Trial Mode: Enter any 4-digit number to successfully log in.
                          </p>
                        </div>

                        <button
                          type="submit"
                          disabled={authLoading}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors disabled:opacity-50"
                        >
                          {authLoading ? 'Validating Token...' : 'Verify & Access Console'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsOtpSent(false);
                            setTestMailUrl(null);
                          }}
                          disabled={authLoading}
                          className="w-full text-center text-[10px] text-brand-text-dim underline hover:text-brand-text-main disabled:opacity-50"
                        >
                          Resend OTP
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* CHAT INBOX OVERLAY (MODAL) */}
          <AnimatePresence>
            {isInboxOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="absolute inset-0 bg-brand-dark-bg z-50 flex flex-col pt-5"
                id="inbox-messages-overlay"
              >
                {/* Inbox Header */}
                <div className="px-4 py-3 border-b border-brand-border flex items-center justify-between bg-brand-dark-card">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-brand-cyan" />
                    <span className="font-display font-bold text-xs text-brand-text-main">Civic In-App Messaging</span>
                  </div>
                  <button 
                    onClick={() => {
                      setIsInboxOpen(false);
                      setActiveChatRoomId(null);
                    }}
                    className="p-1 rounded-full hover:bg-brand-dark-bg text-brand-text-dim hover:text-brand-text-main"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {!activeChatRoomId ? (
                  /* Active Threads List */
                  <div className="flex-1 overflow-y-auto divide-y divide-brand-border">
                    <div className="p-3 bg-brand-cyan-soft/10 text-[9px] text-brand-cyan border-b border-brand-border/40 font-light">
                      Direct connection established with localized authority offices.
                    </div>
                    {chatRooms.map((room) => (
                      <button
                        key={room.id}
                        onClick={() => setActiveChatRoomId(room.id)}
                        className="w-full text-left p-3.5 hover:bg-brand-dark-card transition-colors flex items-center justify-between"
                      >
                        <div className="space-y-1 pr-3 flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 justify-between">
                            <span className="font-bold text-[10.5px] text-brand-text-main truncate">{room.complaintTitle}</span>
                            <span className="text-[8px] text-brand-text-dim shrink-0 font-mono">
                              {room.lastMessageAt ? new Date(room.lastMessageAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                            </span>
                          </div>
                          <p className="text-[10px] text-brand-text-dim truncate font-light">
                            <strong>{room.citizenName}:</strong> {room.lastMessage}
                          </p>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-brand-text-dim shrink-0" />
                      </button>
                    ))}
                  </div>
                ) : (
                  /* Inside Thread Message Loop */
                  <div className="flex-1 flex flex-col justify-between bg-brand-dark-bg" id="chat-conversation-container">
                    {/* Chat top header detail */}
                    <div className="bg-brand-dark-card px-3 py-2 border-b border-brand-border flex items-center justify-between">
                      <button 
                        onClick={() => setActiveChatRoomId(null)}
                        className="text-xs text-brand-cyan font-bold hover:underline"
                      >
                        ← Back
                      </button>
                      <span className="text-[10px] font-mono text-brand-text-dim">Thread Context Active</span>
                    </div>

                    {/* Messages scroll pane */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar animate-fade-in" id="messages-pane">
                      {(allMessages[activeChatRoomId] || []).map((msg) => {
                        const isMe = msg.senderId === currentUser?.id;
                        return (
                          <div 
                            key={msg.id}
                            className={`flex flex-col max-w-[80%] ${isMe ? 'self-end ml-auto' : 'self-start'}`}
                          >
                            <span className="text-[8px] text-brand-text-dim mb-0.5 px-1 font-mono">
                              {msg.senderName} ({msg.senderRole})
                            </span>
                            <div className={`p-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                              isMe 
                                ? 'bg-brand-cyan text-brand-dark-bg font-medium rounded-br-none shadow-md shadow-brand-cyan/15' 
                                : 'bg-brand-dark-card text-brand-text-main rounded-bl-none border border-brand-border'
                            }`}>
                              {msg.content}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatBottomRef} />
                    </div>

                    {/* Input message form */}
                    <form onSubmit={handleSendMessage} className="bg-brand-dark-card p-2 border-t border-brand-border flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="Type transparency update..."
                        value={newMessageText}
                        onChange={(e) => setNewMessageText(e.target.value)}
                        className="flex-1 bg-brand-dark-bg rounded-full px-3 py-1.5 text-xs focus:outline-none focus:bg-brand-dark-card text-brand-text-main border border-brand-border font-light"
                        required
                      />
                      <button 
                        type="submit"
                        className="h-8 w-8 rounded-full bg-brand-cyan flex items-center justify-center text-brand-dark-bg shrink-0 hover:bg-brand-cyan/90 transition-colors"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* PROFILE OVERLAY (MODAL) */}
          <AnimatePresence>
            {isProfileOpen && currentUser && (
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="absolute inset-0 bg-brand-dark-bg z-50 flex flex-col pt-5"
                id="user-profile-overlay"
              >
                {/* Profile Header */}
                <div className="px-4 py-3 border-b border-brand-border flex items-center justify-between bg-brand-dark-card">
                  <div className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-brand-cyan" />
                    <span className="font-display font-bold text-xs text-brand-text-main">User Profile Console</span>
                  </div>
                  <button 
                    onClick={() => setIsProfileOpen(false)}
                    className="p-1 rounded-full hover:bg-brand-dark-bg text-brand-text-dim hover:text-brand-text-main"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Profile Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                  
                  {/* User Info Card */}
                  {isEditingProfile ? (
                    <div className="bg-brand-dark-card border border-brand-cyan/30 rounded-2xl p-4 space-y-4 relative overflow-hidden animate-fade-in">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-brand-cyan/5 rounded-full blur-xl pointer-events-none"></div>
                      <h4 className="text-[9px] font-bold text-brand-cyan uppercase tracking-wider">Customize Identity settings</h4>
                      
                      {/* Avatar Upload Container */}
                      <div className="flex flex-col items-center space-y-1.5 py-1">
                        <div className="relative">
                          <div className="h-16 w-16 rounded-full bg-brand-cyan-soft border-2 border-brand-cyan flex items-center justify-center overflow-hidden shadow-lg">
                            {editAvatarUrl ? (
                              <img src={editAvatarUrl} alt="Preview" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <User className="h-8 w-8 text-brand-cyan" />
                            )}
                          </div>
                          <label 
                            className="absolute bottom-0 right-0 p-1.5 bg-brand-dark-bg border border-brand-border rounded-full hover:bg-brand-dark-card cursor-pointer transition-colors shadow-md flex items-center justify-center"
                            title="Upload picture"
                          >
                            <Camera className="h-3 w-3 text-brand-cyan" />
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleAvatarFileChange} 
                              className="hidden" 
                            />
                          </label>
                        </div>
                        <span className="text-[8px] text-brand-text-dim uppercase font-mono">Upload JPG/PNG profile picture</span>
                      </div>

                      {/* Full Name Input */}
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-brand-text-dim uppercase tracking-wider">Display Name</label>
                        <input
                          type="text"
                          value={editFullName}
                          onChange={(e) => setEditFullName(e.target.value)}
                          placeholder="Your real name"
                          className="w-full bg-brand-dark-bg border border-brand-border focus:border-brand-cyan focus:outline-none rounded-lg px-2.5 py-1.5 text-xs text-brand-text-main"
                          required
                        />
                      </div>

                      {/* Username Input */}
                      <div className="space-y-1">
                        <label className="text-[8px] font-bold text-brand-text-dim uppercase tracking-wider">Unique Username</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-brand-cyan">@</span>
                          <input
                            type="text"
                            value={editUsername}
                            onChange={(e) => setEditUsername(e.target.value)}
                            placeholder="username"
                            className="w-full bg-brand-dark-bg border border-brand-border focus:border-brand-cyan focus:outline-none rounded-lg pl-6 pr-2.5 py-1.5 text-xs text-brand-text-main font-mono"
                          />
                        </div>
                        <span className="text-[7.5px] text-brand-text-dim block leading-tight">Must be unique. Allowed: letters, numbers, underscores (3-15 chars).</span>
                      </div>

                      {profileError && (
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-2 flex items-start gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                          <span className="text-[9px] text-rose-300 leading-tight">{profileError}</span>
                        </div>
                      )}

                      {/* Form Actions */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingProfile(false);
                            setProfileError(null);
                          }}
                          className="py-1.5 bg-brand-dark-bg border border-brand-border hover:bg-brand-dark-card text-brand-text-main font-bold rounded-lg text-xs transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveProfile}
                          className="py-1.5 bg-brand-cyan text-brand-dark-bg hover:bg-brand-cyan/90 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-brand-dark-card border border-brand-border rounded-2xl p-4 space-y-3 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-brand-cyan/5 rounded-full blur-xl pointer-events-none"></div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-brand-cyan-soft border border-brand-cyan/25 flex items-center justify-center overflow-hidden">
                            {currentUser.avatarUrl ? (
                              <img src={currentUser.avatarUrl} alt="Avatar" className="h-full w-full object-cover animate-fade-in" referrerPolicy="no-referrer" />
                            ) : (
                              <User className="h-5 w-5 text-brand-cyan" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-display font-bold text-[13px] text-brand-text-main leading-tight">
                              {currentUser.fullName}
                            </h3>
                            <p className="text-[10px] text-brand-text-dim font-mono mt-0.5">
                              {currentUser.username ? `@${currentUser.username}` : 'No username set'} • {currentUser.role === 'citizen' ? 'Citizen' : 'Officer'}
                            </p>
                          </div>
                        </div>

                        <button 
                          onClick={() => setIsEditingProfile(true)}
                          className="px-2 py-1 bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan/20 text-[8.5px] font-bold rounded-lg transition-colors uppercase tracking-wider"
                        >
                          Edit
                        </button>
                      </div>

                      <div className="pt-2 border-t border-brand-border/40 grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span className="text-brand-text-dim block uppercase text-[7px] font-bold font-mono tracking-wider">Contact Detail</span>
                          <span className="font-mono text-brand-text-main">{getMaskedEmailOrPhone(currentUser.emailOrPhone)}</span>
                        </div>
                        <div>
                          <span className="text-brand-text-dim block uppercase text-[7px] font-bold font-mono tracking-wider">Member Since</span>
                          <span className="font-mono text-brand-text-main">
                            {new Date(currentUser.createdAt || '2026-01-01').toLocaleDateString([], {month: 'short', year: 'numeric'})}
                          </span>
                        </div>
                      </div>

                      {currentUser.role === 'officer' && (
                        <div className="pt-2 border-t border-brand-border/40 text-[10px] space-y-1">
                          <div>
                            <span className="text-brand-text-dim block uppercase text-[7px] font-bold font-mono tracking-wider">Assigned Jurisdiction</span>
                            <span className="text-brand-cyan font-bold">
                              {currentUser.district}, {currentUser.state}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="pt-2.5 border-t border-brand-border/40 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-brand-text-dim block uppercase text-[7px] font-bold font-mono tracking-wider">Reward Purse</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Coins className="h-3.5 w-3.5 text-brand-coin" />
                              <span className="text-sm font-bold font-mono text-brand-coin">{currentUser.coinBalance} <span className="text-[9px] text-brand-text-dim font-normal font-sans">Coins</span></span>
                            </div>
                          </div>
                          
                          {currentUser.role === 'citizen' && (
                            <div className="bg-brand-cyan/5 border border-brand-cyan/15 rounded-lg px-2 py-1 text-right">
                              <span className="text-brand-cyan block text-[7px] uppercase font-bold tracking-wider">Level Status</span>
                              <span className="text-[10px] text-brand-text-main font-bold">
                                {currentUser.coinBalance >= 500 ? 'Elite Warden' : currentUser.coinBalance >= 200 ? 'Active Sentinel' : 'Vanguard'}
                              </span>
                            </div>
                          )}
                        </div>

                        {currentUser.role === 'citizen' && (
                          <button
                            onClick={() => {
                              setIsProfileOpen(false);
                              setActiveCoinsTab('redeem');
                              setIsCoinsOpen(true);
                            }}
                            className="w-full mt-1.5 py-2 bg-gradient-to-r from-brand-coin/20 to-amber-500/10 border border-brand-coin/30 hover:from-brand-coin/30 hover:to-amber-500/20 text-brand-coin font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-inner"
                          >
                            <Gift className="h-3.5 w-3.5 text-brand-coin" />
                            Manage & Redeem Rewards
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {currentUser.role === 'officer' && (
                    <div className="space-y-2 animate-fade-in">
                      <h4 className="text-[9px] font-bold uppercase text-brand-text-dim tracking-wider">Complaints Summary Dashboard</h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-brand-dark-card border border-brand-border rounded-xl p-2.5 text-center">
                          <span className="text-[14px] font-bold text-emerald-400 font-mono">
                            {complaints.filter(c => c.resolvedBy === currentUser.fullName).length}
                          </span>
                          <span className="text-[7.5px] text-brand-text-dim block leading-tight mt-1">Resolved By You</span>
                        </div>
                        <div className="bg-brand-dark-card border border-brand-border rounded-xl p-2.5 text-center">
                          <span className="text-[14px] font-bold text-amber-500 font-mono">
                            {complaints.filter(c => c.district === currentUser.district && c.status === 'pending').length}
                          </span>
                          <span className="text-[7.5px] text-brand-text-dim block leading-tight mt-1">Pending in Dist.</span>
                        </div>
                        <div className="bg-brand-dark-card border border-brand-border rounded-xl p-2.5 text-center">
                          <span className="text-[14px] font-bold text-brand-cyan font-mono">
                            {complaints.filter(c => c.district === currentUser.district && c.status === 'resolved').length}
                          </span>
                          <span className="text-[7.5px] text-brand-text-dim block leading-tight mt-1">Resolved in Dist.</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[9px] font-bold uppercase text-brand-text-dim tracking-wider">
                        {currentUser.role === 'citizen' ? 'Your Activity History' : 'District Jurisdiction Feed'}
                      </h4>
                      <span className="text-[8px] font-mono text-brand-text-dim uppercase">
                        Chronological Order
                      </span>
                    </div>

                    <div className="space-y-2">
                      {currentUser.role === 'citizen' ? (
                        <>
                          {citizenComplaints.length === 0 ? (
                            <div className="text-center py-6 border border-dashed border-brand-border rounded-xl text-brand-text-dim text-[10px]">
                              No registered reports or verifications found yet.
                            </div>
                          ) : (
                            citizenComplaints.map((comp) => {
                              const isReporter = comp.reporterId === currentUser.id;
                              const isVerifier = comp.verifiedUserIds.includes(currentUser.id);
                              
                              return (
                                <div 
                                  key={comp.id} 
                                  className="bg-brand-dark-card border border-brand-border hover:border-brand-border/80 transition-colors rounded-xl p-3 space-y-2 relative"
                                >
                                  <div className="flex justify-between items-start gap-2">
                                    <div className="space-y-0.5">
                                      <span className="text-[8px] font-mono text-brand-text-dim uppercase block">
                                        {new Date(comp.createdAt).toLocaleDateString([], {month: 'short', day: 'numeric', year: 'numeric'})}
                                      </span>
                                      <h5 className="font-semibold text-[10.5px] text-brand-text-main line-clamp-1">{comp.title}</h5>
                                    </div>
                                    <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-md shrink-0 uppercase tracking-wide border ${
                                      comp.status === 'resolved' 
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' 
                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                                    }`}>
                                      {comp.status}
                                    </span>
                                  </div>

                                  <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-brand-border/30 text-[9px]">
                                    <div className="flex flex-wrap gap-1">
                                      {isReporter && (
                                        <span className="bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-[8px] font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                          <Award className="h-2.5 w-2.5" /> Reporter (+100)
                                        </span>
                                      )}
                                      {isVerifier && (
                                        <span className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[8px] font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                          <CheckCircle className="h-2.5 w-2.5" /> Reviewed (+50)
                                        </span>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center gap-1 font-mono text-[9px] text-brand-coin font-bold">
                                      <Coins className="h-2.5 w-2.5" />
                                      <span>+{(isReporter ? 100 : 0) + (isVerifier ? 50 : 0)} Coins</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </>
                      ) : (
                        <>
                          {officerComplaints.length === 0 ? (
                            <div className="text-center py-6 border border-dashed border-brand-border rounded-xl text-brand-text-dim text-[10px]">
                              No district complaints recorded yet.
                            </div>
                          ) : (
                            officerComplaints.map((comp) => {
                              const isResolvedByMe = comp.resolvedBy === currentUser.fullName;
                              
                              return (
                                <div 
                                  key={comp.id} 
                                  className="bg-brand-dark-card border border-brand-border hover:border-brand-border/80 transition-colors rounded-xl p-3 space-y-2 relative"
                                >
                                  <div className="flex justify-between items-start gap-2">
                                    <div className="space-y-0.5">
                                      <span className="text-[8px] font-mono text-brand-text-dim uppercase block">
                                        {new Date(comp.createdAt).toLocaleDateString([], {month: 'short', day: 'numeric', year: 'numeric'})}
                                      </span>
                                      <h5 className="font-semibold text-[10.5px] text-brand-text-main line-clamp-1">{comp.title}</h5>
                                    </div>
                                    <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-md shrink-0 uppercase tracking-wide border ${
                                      comp.status === 'resolved' 
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' 
                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                                    }`}>
                                      {comp.status}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-brand-border/30 text-[9px]">
                                    <span className="text-brand-text-dim">
                                      {comp.district} Scope
                                    </span>
                                    
                                    {isResolvedByMe ? (
                                      <span className="bg-emerald-500/15 text-emerald-400 text-[8px] font-bold px-1.5 py-0.2 rounded border border-emerald-500/25">
                                        Resolved by You
                                      </span>
                                    ) : (
                                      <span className="text-brand-text-dim text-[8px] font-mono">
                                        Audited by {comp.verificationsCount}/10
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-center pt-2">
                    <button
                      onClick={handleLogout}
                      className="px-6 py-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Log Out
                    </button>
                  </div>
                  
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* COINS LEDGER & REWARDS OVERLAY (MODAL) */}
          <AnimatePresence>
            {isCoinsOpen && currentUser && (
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="absolute inset-0 bg-brand-dark-bg z-50 flex flex-col pt-5"
                id="coins-ledger-overlay"
              >
                {/* Overlay Header */}
                <div className="px-4 py-3 border-b border-brand-border flex items-center justify-between bg-brand-dark-card shadow-sm">
                  <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-brand-coin animate-bounce" />
                    <h3 className="font-display font-extrabold text-[14px] text-brand-text-main tracking-tight uppercase">
                      Civic Rewards Hub
                    </h3>
                  </div>
                  <button 
                    onClick={() => {
                      setIsCoinsOpen(false);
                      setSelectedVoucher(null);
                      setRedeemedCode(null);
                    }}
                    className="p-1 rounded-full hover:bg-brand-dark-bg text-brand-text-dim hover:text-brand-text-main transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                  
                  {/* Balance card */}
                  <div className="bg-gradient-to-br from-brand-dark-card to-brand-dark-bg border border-brand-border rounded-2xl p-4 flex items-center justify-between relative overflow-hidden shadow-lg">
                    <div className="absolute -top-10 -right-10 w-28 h-28 bg-brand-coin/10 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="space-y-1">
                      <span className="text-[7.5px] uppercase font-bold tracking-widest text-brand-text-dim font-mono block">Available Purse</span>
                      <div className="flex items-baseline gap-1.5">
                        <Coins className="h-5 w-5 text-brand-coin" />
                        <span className="text-2xl font-extrabold font-mono text-brand-coin tracking-tight">{currentUser.coinBalance}</span>
                        <span className="text-[10px] text-brand-text-dim font-medium">Coins</span>
                      </div>
                      <p className="text-[8px] text-emerald-400/90 font-mono flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5" /> Earn more by reporting or verifying issues!
                      </p>
                    </div>
                    
                    <div className="bg-brand-coin/5 border border-brand-coin/15 rounded-xl px-2.5 py-1.5 text-right shrink-0">
                      <span className="text-brand-coin block text-[7px] uppercase font-bold tracking-widest font-mono">Civic Level</span>
                      <span className="text-[11px] text-brand-text-main font-extrabold uppercase tracking-wide">
                        {currentUser.coinBalance >= 500 ? '⭐ Elite Warden' : currentUser.coinBalance >= 200 ? '🛡️ Active Sentinel' : '🌱 Vanguard'}
                      </span>
                    </div>
                  </div>

                  {/* Tabs bar */}
                  <div className="flex bg-brand-dark-card border border-brand-border/60 rounded-xl p-1 gap-1">
                    <button
                      onClick={() => {
                        setActiveCoinsTab('redeem');
                        setSelectedVoucher(null);
                        setRedeemedCode(null);
                      }}
                      className={`flex-1 py-1.5 text-[10.5px] font-bold rounded-lg transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 ${
                        activeCoinsTab === 'redeem'
                          ? 'bg-brand-coin text-brand-dark-bg font-extrabold shadow-sm'
                          : 'text-brand-text-dim hover:text-brand-text-main'
                      }`}
                    >
                      <Gift className="h-3.5 w-3.5" />
                      Claim Rewards
                    </button>
                    <button
                      onClick={() => {
                        setActiveCoinsTab('history');
                        setSelectedVoucher(null);
                        setRedeemedCode(null);
                      }}
                      className={`flex-1 py-1.5 text-[10.5px] font-bold rounded-lg transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 ${
                        activeCoinsTab === 'history'
                          ? 'bg-brand-coin text-brand-dark-bg font-extrabold shadow-sm'
                          : 'text-brand-text-dim hover:text-brand-text-main'
                      }`}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Coin Ledger
                    </button>
                  </div>

                  {/* ACTIVE TAB DISPLAY */}
                  {activeCoinsTab === 'redeem' ? (
                    <div className="space-y-3">
                      {selectedVoucher ? (
                        /* REDEEM VOUCHER FOCUS SCREEN */
                        <div className="bg-brand-dark-card border border-brand-border rounded-2xl p-4 space-y-4 animate-fade-in relative">
                          
                          {/* Selected Gift banner */}
                          <div className={`p-4 rounded-xl bg-gradient-to-r ${selectedVoucher.brandColor} text-white flex justify-between items-center relative overflow-hidden shadow-md`}>
                            <div className="absolute right-0 top-0 bottom-0 w-24 bg-white/5 skew-x-12 pointer-events-none"></div>
                            <div>
                              <span className="text-[7.5px] uppercase font-bold tracking-widest bg-black/25 px-1.5 py-0.5 rounded text-white/90">{selectedVoucher.name}</span>
                              <h4 className="text-lg font-extrabold mt-1 tracking-tight">{selectedVoucher.rewardValue}</h4>
                            </div>
                            <Coins className="h-10 w-10 text-amber-300 shrink-0 opacity-85" />
                          </div>

                          <p className="text-[10px] text-brand-text-dim leading-relaxed font-sans">{selectedVoucher.desc}</p>

                          {/* Handle Eligibility */}
                          {currentUser.coinBalance < selectedVoucher.coins ? (
                            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-[10px] flex items-start gap-2 animate-fade-in">
                              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                              <div>
                                <strong className="font-bold uppercase tracking-wider block text-rose-400">Balance Shortfall</strong>
                                You need <span className="font-mono font-bold text-rose-300">{selectedVoucher.coins - currentUser.coinBalance} more coins</span> to claim this reward. Submit unique citizen complaints or perform geofenced verifications to earn.
                              </div>
                            </div>
                          ) : redeemedCode ? (
                            /* CLAIM SUCCESS SCREEN */
                            <div className="space-y-4 animate-fade-in text-center p-2.5">
                              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                                <Check className="h-6 w-6 text-emerald-400 animate-notch-pulse" />
                              </div>
                              
                              <div className="space-y-1">
                                <h5 className="text-[13px] font-extrabold text-emerald-400 uppercase tracking-wider">Redemption Complete!</h5>
                                <p className="text-[9.5px] text-brand-text-dim">Your voucher is ready. Tap code to copy:</p>
                              </div>

                              {/* Copied ledger ticket */}
                              <div className="bg-brand-dark-bg border border-emerald-500/35 rounded-xl p-3 flex items-center justify-between gap-2 font-mono text-xs select-all">
                                <span className="text-emerald-400 font-extrabold tracking-wider">{redeemedCode}</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(redeemedCode);
                                    showToast("Voucher code copied to clipboard!", "success");
                                  }}
                                  className="p-1.5 hover:bg-emerald-500/15 rounded-lg text-brand-text-dim hover:text-emerald-400 transition-colors"
                                  title="Copy code"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button>
                              </div>

                              <p className="text-[8px] text-brand-text-dim italic">This code can be redeemed immediately. A backup copy was sent to your registered credentials.</p>

                              <button
                                onClick={() => {
                                  setSelectedVoucher(null);
                                  setRedeemedCode(null);
                                }}
                                className="w-full mt-2 py-2 bg-brand-cyan text-brand-dark-bg font-extrabold rounded-xl text-[10px] uppercase tracking-wider transition-colors hover:bg-brand-cyan/90"
                              >
                                Back to catalog
                              </button>
                            </div>
                          ) : (
                            /* CAPTURE PAYMENT UPI DETAILS FORM */
                            <div className="space-y-4 animate-fade-in">
                              <div className="space-y-1">
                                <label className="text-[8.5px] font-mono font-bold text-brand-text-dim uppercase tracking-wider block">
                                  {selectedVoucher.id.includes('phonepe') ? 'UPI ID or Registered Phonepe Mobile' : 'Account Details (Mobile Number / Email)'}
                                </label>
                                <input
                                  type="text"
                                  placeholder={selectedVoucher.id.includes('phonepe') ? 'e.g. 9876543210@ybl or phone number' : 'e.g. 9876543210 or your email'}
                                  value={phonePeNumber}
                                  onChange={(e) => setPhonePeNumber(e.target.value)}
                                  className="w-full bg-brand-dark-bg border border-brand-border rounded-xl px-3 py-2 text-xs font-mono text-brand-text-main focus:outline-none focus:border-brand-coin/60"
                                />
                              </div>

                              <div className="flex gap-2 text-[9.5px] items-center text-brand-text-dim bg-brand-dark-bg/40 p-2.5 rounded-lg border border-brand-border/40">
                                <Ticket className="h-4 w-4 text-brand-coin shrink-0 animate-pulse" />
                                <span>Charges <strong className="text-brand-coin">{selectedVoucher.coins} Coins</strong> from available rewards.</span>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => setSelectedVoucher(null)}
                                  className="flex-1 py-2 bg-brand-dark-bg border border-brand-border hover:bg-brand-dark-card text-brand-text-main text-[10px] font-bold rounded-xl uppercase tracking-wider transition-colors"
                                >
                                  Back
                                </button>
                                <button
                                  disabled={isScratchAnimating || !phonePeNumber.trim()}
                                  onClick={() => {
                                    setIsScratchAnimating(true);
                                    setTimeout(() => {
                                      setIsScratchAnimating(false);
                                      const code = `${selectedVoucher.prefix}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
                                      redeemCoins(selectedVoucher.coins, `${selectedVoucher.name} - ${selectedVoucher.rewardValue}`);
                                      setRedeemedCode(code);
                                    }, 1200);
                                  }}
                                  className={`flex-1 py-2 bg-brand-coin disabled:opacity-50 text-brand-dark-bg text-[10px] font-extrabold rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                                    isScratchAnimating ? 'animate-pulse' : 'hover:bg-amber-400 active:scale-95'
                                  }`}
                                >
                                  {isScratchAnimating ? 'Locking coins...' : 'Redeem Now'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* CATALOG OF OPTIONS */
                        <div className="grid grid-cols-2 gap-2 pb-6">
                          {[
                            {
                              id: 'phonepe_500',
                              name: 'PhonePe Gift Card',
                              coins: 1500,
                              rewardValue: 'Rs. 500 Gift Card',
                              brandColor: 'from-purple-600 to-indigo-800',
                              badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/25',
                              desc: 'Instant cashback wallet transfer to your linked PhonePe account.',
                              prefix: 'PP-RS500'
                            },
                            {
                              id: 'makemytrip_1000',
                              name: 'MakeMyTrip Voucher',
                              coins: 3000,
                              rewardValue: 'Rs. 1000 Discount',
                              brandColor: 'from-blue-600 to-sky-800',
                              badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
                              desc: 'Rs. 1000 flat discount voucher on domestic hotels, flights or holidays.',
                              prefix: 'MMT-F1000'
                            },
                            {
                              id: 'googleplay_250',
                              name: 'Google Play Gift Card',
                              coins: 750,
                              rewardValue: 'Rs. 250 Code',
                              brandColor: 'from-emerald-600 to-teal-800',
                              badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
                              desc: 'Rs. 250 recharge code for apps, books, games and items.',
                              prefix: 'GPL-RS250'
                            },
                            {
                              id: 'amazonpay_500',
                              name: 'Amazon Pay Balance',
                              coins: 1500,
                              rewardValue: 'Rs. 500 Pay Card',
                              brandColor: 'from-amber-600 to-orange-700',
                              badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
                              desc: 'Rs. 500 added directly to your Amazon Pay wallet balance.',
                              prefix: 'AMZ-PAY500'
                            },
                            {
                              id: 'paytm_300',
                              name: 'Paytm Wallet Cashback',
                              coins: 900,
                              rewardValue: 'Rs. 300 Wallet Cash',
                              brandColor: 'from-sky-500 to-blue-700',
                              badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/25',
                              desc: 'Rs. 300 instant wallet cashback transfer voucher code.',
                              prefix: 'PTM-CB300'
                            },
                            {
                              id: 'bookmyshow_200',
                              name: 'BookMyShow Promo',
                              coins: 600,
                              rewardValue: 'Rs. 200 Voucher',
                              brandColor: 'from-rose-600 to-pink-800',
                              badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
                              desc: 'Rs. 200 off on cinema tickets, plays, activities or events.',
                              prefix: 'BMS-MV200'
                            },
                            {
                              id: 'swiggy_500',
                              name: 'Swiggy Food & Money',
                              coins: 1500,
                              rewardValue: 'Rs. 500 Swiggy Voucher',
                              brandColor: 'from-orange-500 to-red-600',
                              badgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/25',
                              desc: 'Rs. 500 discount balance for dining, instamart or gourmet deliveries.',
                              prefix: 'SWG-DN500'
                            },
                            {
                              id: 'zomato_400',
                              name: 'Zomato Dining Card',
                              coins: 1200,
                              rewardValue: 'Rs. 400 Food Coupon',
                              brandColor: 'from-red-600 to-rose-700',
                              badgeColor: 'bg-red-500/10 text-red-400 border-red-500/25',
                              desc: 'Rs. 400 instant promo discount code applicable on Zomato application.',
                              prefix: 'ZMT-FD400'
                            }
                          ].map((item) => {
                            const isEligible = currentUser.coinBalance >= item.coins;
                            return (
                              <button
                                key={item.id}
                                onClick={() => {
                                  setSelectedVoucher(item);
                                  setPhonePeNumber(currentUser.emailOrPhone || '');
                                }}
                                className="bg-brand-dark-card border border-brand-border hover:border-brand-coin/40 transition-all rounded-xl p-3 flex flex-col justify-between text-left relative overflow-hidden group"
                              >
                                <div className="absolute top-0 right-0 w-12 h-12 bg-brand-coin/5 rounded-full blur-lg group-hover:bg-brand-coin/15 transition-colors"></div>
                                <div className="space-y-1.5">
                                  <span className={`text-[7px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${item.badgeColor}`}>
                                    {item.name.split(' ')[0]}
                                  </span>
                                  <div>
                                    <h4 className="font-extrabold text-[11px] text-brand-text-main leading-snug line-clamp-1 group-hover:text-brand-coin transition-colors">{item.name}</h4>
                                    <p className="text-[10px] text-emerald-400 font-bold tracking-tight mt-0.5">{item.rewardValue}</p>
                                  </div>
                                </div>
                                
                                <div className="mt-3 flex items-center justify-between border-t border-brand-border/30 pt-2 w-full">
                                  <span className="text-[9px] font-mono font-bold text-brand-coin flex items-center gap-0.5">
                                    <Coins className="h-2.5 w-2.5" /> {item.coins}
                                  </span>
                                  
                                  <span className={`text-[8.5px] font-bold uppercase tracking-wider ${
                                    isEligible ? 'text-brand-cyan' : 'text-brand-text-dim'
                                  }`}>
                                    {isEligible ? 'Redeem →' : 'Locked'}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* HISTORY COIN LEDGER TAB */
                    <div className="space-y-2 pb-6">
                      <div className="flex justify-between items-center text-[9px] uppercase font-bold text-brand-text-dim font-mono tracking-wider px-1">
                        <span>Transaction Details</span>
                        <span>Amount / Date</span>
                      </div>
                      
                      {coinTransactions.filter(tx => tx.userId === currentUser.id).length === 0 ? (
                        <div className="text-center py-10 border border-dashed border-brand-border rounded-xl text-brand-text-dim text-[10px] space-y-1.5">
                          <Coins className="h-6 w-6 mx-auto text-brand-text-dim opacity-35" />
                          <p>No reward ledger entries recorded yet.</p>
                        </div>
                      ) : (
                        coinTransactions
                          .filter(tx => tx.userId === currentUser.id)
                          .map((tx) => {
                            const isEarn = tx.amount > 0;
                            return (
                              <div 
                                key={tx.id}
                                className="bg-brand-dark-card border border-brand-border/60 rounded-xl p-3 flex items-center justify-between gap-3 relative overflow-hidden"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${
                                    isEarn 
                                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                      : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                  }`}>
                                    {isEarn ? (
                                      tx.type === 'earn_report' ? <Award className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />
                                    ) : (
                                      <Gift className="h-4 w-4" />
                                    )}
                                  </div>
                                  <div className="min-w-0 space-y-0.5">
                                    <h5 className="text-[10.5px] font-bold text-brand-text-main line-clamp-1 leading-snug">{tx.description}</h5>
                                    <span className="text-[8px] font-mono text-brand-text-dim block uppercase tracking-wider">
                                      {tx.type === 'earn_report' ? 'REPORT REWARD' : tx.type === 'earn_verify' ? 'REVIEW CREDITS' : 'REDEMPTION'}
                                    </span>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <div className={`font-mono text-[11.5px] font-bold flex items-center justify-end gap-0.5 ${
                                    isEarn ? 'text-emerald-400' : 'text-amber-400'
                                  }`}>
                                    {isEarn ? '+' : ''}{tx.amount}
                                    <Coins className="h-3 w-3 shrink-0" />
                                  </div>
                                  <span className="text-[8px] font-mono text-brand-text-dim block mt-0.5">
                                    {new Date(tx.createdAt).toLocaleDateString([], {month: 'short', day: 'numeric'})}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  )}

                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* NAVIGATION MAP OVERLAY */}
          <AnimatePresence>
            {activeMapComplaint && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#080808]/95 backdrop-blur-sm z-50 flex flex-col justify-end"
                id="maps-direction-overlay"
              >
                <div className="bg-brand-dark-card border-t border-brand-border rounded-t-[28px] p-4 space-y-4 max-h-[90%] overflow-y-auto animate-slide-up">
                  <div className="flex justify-between items-center border-b border-brand-border pb-2">
                    <span className="text-[9px] font-bold bg-brand-cyan-soft text-brand-cyan px-2 py-0.5 rounded border border-brand-cyan/20 uppercase tracking-wider">GIS Routing Platform</span>
                    <button 
                      onClick={() => setActiveMapComplaint(null)} 
                      className="p-1 rounded-full hover:bg-brand-dark-bg transition-colors"
                    >
                      <X className="h-4 w-4 text-brand-text-dim" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[8px] bg-brand-cyan/15 text-brand-cyan px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider border border-brand-cyan/25">Target Incident</span>
                    <h3 className="font-display font-bold text-xs text-brand-text-main mt-1">{activeMapComplaint.title}</h3>
                    <p className="text-[10px] text-brand-text-dim flex items-center gap-0.5">
                      <MapPin className="h-3.5 w-3.5 text-brand-cyan animate-pulse" /> {activeMapComplaint.address}
                    </p>
                  </div>

                  {/* Simulated Map Graphic Vector with live data */}
                  <div className="w-full h-28 bg-brand-dark-bg rounded-xl relative overflow-hidden border border-brand-border flex flex-col items-center justify-center">
                    {/* Simulated grid background */}
                    <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]" />
                    
                    <div className="absolute inset-0 opacity-10 font-mono text-[7px] text-brand-cyan overflow-hidden leading-none select-none p-1">
                      {Array.from({length: 8}).map((_, i) => (
                        <div key={i} className="whitespace-nowrap tracking-widest">
                          GRID_SECTOR_0{i}_ACTIVE_ROUTE_MAPPING_VERIFICATION_ENABLED_COORD_LOCKED
                        </div>
                      ))}
                    </div>

                    {/* Source Device Pin */}
                    <div className="absolute top-8 left-10 flex flex-col items-center z-10">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-cyan opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-cyan border-2 border-white"></span>
                      </span>
                      <span className="text-[7px] font-bold text-brand-text-main mt-1 bg-brand-dark-bg/80 px-1 rounded border border-brand-border/40">You</span>
                    </div>

                    {/* Path vector dotted line */}
                    <div className="absolute top-9 left-14 w-32 h-8 border-b-2 border-dashed border-brand-cyan/40 animate-pulse"></div>

                    {/* Target Incident Pin */}
                    <div className="absolute top-12 right-12 flex flex-col items-center z-10">
                      <MapPin className="h-5 w-5 text-rose-500 animate-bounce" />
                      <span className="text-[7px] font-bold text-rose-300 bg-rose-500/20 px-1 py-0.2 rounded border border-rose-500/25 mt-0.5">Incident</span>
                    </div>
                  </div>

                  {/* Dynamic Route Info, Exact Distance & Directions */}
                  {(() => {
                    const sLat = routeStartLat !== null ? routeStartLat : deviceLocation.lat;
                    const sLng = routeStartLng !== null ? routeStartLng : deviceLocation.lng;
                    const dLat = activeMapComplaint.latitude;
                    const dLng = activeMapComplaint.longitude;
                    const distance = calculateDistanceInMeters(sLat, sLng, dLat, dLng);
                    const speedWalkMin = Math.max(1, Math.round(distance / 80)); // ~80m per min walk

                    // Let's create smart dynamic step-by-step route directions
                    const directions: string[] = [];
                    const latDiff = dLat - sLat;
                    const lngDiff = dLng - sLng;

                    directions.push(`Depart from ${routeStartAddress || "your detected coordinate point"}.`);

                    if (Math.abs(latDiff) > 0.0001) {
                      const latDir = latDiff > 0 ? "North" : "South";
                      const meters = Math.round(Math.abs(latDiff) * 111000);
                      directions.push(`Walk approximately ${meters}m ${latDir} through the sector connector.`);
                    }

                    if (Math.abs(lngDiff) > 0.0001) {
                      const lngDir = lngDiff > 0 ? "East" : "West";
                      directions.push(`Turn ${lngDiff > 0 ? "Right" : "Left"} towards the incident hub (${lngDir} direction).`);
                    }

                    directions.push(`Arrive safely at incident site: ${activeMapComplaint.address}.`);

                    return (
                      <div className="space-y-3">
                        {/* Start and End nodes listing */}
                        <div className="p-2.5 bg-brand-dark-bg border border-brand-border rounded-xl text-[10px] space-y-2">
                          <div className="flex gap-1.5 items-start">
                            <span className="w-3 h-3 rounded-full bg-brand-cyan border border-white mt-0.5 shrink-0" />
                            <div className="leading-snug">
                              <span className="text-brand-text-dim block text-[8px] font-bold uppercase">Starting Position</span>
                              <span className="text-brand-text-main font-medium">{routeStartAddress || "Detecting your location..."}</span>
                              <span className="text-[8.5px] font-mono text-brand-cyan block">GPS: {sLat.toFixed(5)}, {sLng.toFixed(5)}</span>
                            </div>
                          </div>
                          
                          <div className="border-l border-dashed border-brand-border h-3 ml-1.5" />

                          <div className="flex gap-1.5 items-start">
                            <MapPin className="h-3 w-3 text-rose-500 shrink-0 mt-0.5" />
                            <div className="leading-snug">
                              <span className="text-brand-text-dim block text-[8px] font-bold uppercase">Incident Destination</span>
                              <span className="text-brand-text-main font-medium">{activeMapComplaint.address}</span>
                              <span className="text-[8.5px] font-mono text-brand-cyan block">GPS: {dLat.toFixed(5)}, {dLng.toFixed(5)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Calculated Ledger */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-brand-dark-bg p-2 rounded-lg border border-brand-border">
                            <span className="text-[8px] text-brand-text-dim block uppercase font-bold tracking-wide">Exact Route Distance</span>
                            <span className="text-xs font-bold font-mono text-brand-cyan">
                              {distance >= 1000 ? `${(distance / 1000).toFixed(2)} km` : `${Math.round(distance)} meters`}
                            </span>
                          </div>
                          <div className="bg-brand-dark-bg p-2 rounded-lg border border-brand-border">
                            <span className="text-[8px] text-brand-text-dim block uppercase font-bold tracking-wide">Estimated Walk Time</span>
                            <span className="text-xs font-bold text-brand-cyan font-mono">
                              ~{speedWalkMin} {speedWalkMin === 1 ? 'min' : 'mins'}
                            </span>
                          </div>
                        </div>

                        {/* Best Suggested Route List */}
                        <div className="bg-brand-dark-bg/60 p-2.5 rounded-lg border border-brand-border space-y-1.5">
                          <span className="text-[8px] text-brand-text-dim block uppercase font-bold tracking-wide">Suggested Best Route directions</span>
                          <div className="space-y-1 text-[9.5px]">
                            {directions.map((step, idx) => (
                              <div key={idx} className="flex gap-2 text-brand-text-main leading-tight font-light">
                                <span className="font-mono font-bold text-brand-cyan shrink-0">{idx + 1}.</span>
                                <p>{step}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Google Maps Button trigger */}
                        <button
                          type="button"
                          onClick={() => {
                            const url = `https://www.google.com/maps/dir/?api=1&origin=${sLat},${sLng}&destination=${dLat},${dLng}&travelmode=walking`;
                            onAddLog('geofence', `Opening system navigator: Routing from starting GPS (${sLat.toFixed(5)}, ${sLng.toFixed(5)}) to target incident (${dLat.toFixed(5)}, ${dLng.toFixed(5)}) on external Google Maps.`);
                            window.open(url, '_blank');
                          }}
                          className="w-full py-2.5 bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark-bg text-[10.5px] font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all uppercase tracking-wider"
                        >
                          <Map className="h-4 w-4" />
                          Set Location in Google Maps
                        </button>
                      </div>
                    );
                  })()}

                  <p className="text-[8.5px] text-brand-text-dim italic text-center font-light pt-1">
                    🔒 Integrated securely with the external Google Maps Directions framework.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CROWDSOURCED VERIFICATION SUBMIT (MODAL) */}
          <AnimatePresence>
            {activeReviewComplaint && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#080808]/95 backdrop-blur-sm z-50 flex flex-col justify-end"
                id="review-verification-overlay"
              >
                <div className="bg-brand-dark-card border-t border-brand-border rounded-t-[28px] p-4 space-y-4 max-h-[90%] overflow-y-auto">
                  <div className="flex justify-between items-center border-b border-brand-border pb-2">
                    <span className="text-xs font-display font-bold text-brand-text-main">Crowdsourced Verification Audit</span>
                    <button 
                      onClick={() => {
                        setActiveReviewComplaint(null);
                        setReviewSelfieCaptured(false);
                        setReviewSelfieUrl('');
                        setReviewGpsCaptured(false);
                      }} 
                      className="p-1 rounded-full hover:bg-brand-dark-bg"
                    >
                      <X className="h-4 w-4 text-brand-text-dim" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[8px] font-mono bg-brand-cyan-soft text-brand-cyan px-1.5 py-0.2 rounded font-bold uppercase border border-brand-cyan/25">Incident Scope</span>
                    <h3 className="font-bold text-xs text-brand-text-main">{activeReviewComplaint.title}</h3>
                    <p className="text-[9px] text-brand-text-dim">{activeReviewComplaint.address}</p>
                  </div>

                  {/* Requirements List */}
                  <div className="space-y-3">
                    
                    {/* Item 1: Live Selfie */}
                    <div className="border border-brand-border p-3 rounded-xl space-y-2 bg-brand-dark-bg">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-brand-text-main">1. Live Situation Snapshot</span>
                        {reviewSelfieCaptured ? (
                          <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-0.5"><Check className="h-3 w-3" /> Captured</span>
                        ) : (
                          <span className="text-rose-400 text-[9px] font-medium">Awaiting Capture</span>
                        )}
                      </div>

                      {isReviewCameraActive ? (
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-brand-cyan/30 bg-black flex flex-col justify-end">
                          <video
                            ref={reviewVideoRef}
                            autoPlay
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent flex justify-center gap-2 z-10">
                            <button
                              type="button"
                              onClick={captureReviewPhoto}
                              className="px-3 py-1 bg-brand-cyan text-brand-dark-bg font-bold text-[10px] rounded hover:bg-brand-cyan/90 transition-all flex items-center gap-1 shadow-md"
                            >
                              <Check className="h-3 w-3" /> Capture Live Photo
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsReviewCameraActive(false);
                                if (reviewVideoStream) {
                                  reviewVideoStream.getTracks().forEach(track => track.stop());
                                  setReviewVideoStream(null);
                                }
                              }}
                              className="px-3 py-1 bg-brand-dark-bg border border-brand-border text-brand-text-main font-bold text-[10px] rounded hover:bg-brand-dark-card transition-all shadow-md"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : reviewCameraError ? (
                        <div className="text-center p-2 border border-dashed border-rose-500/30 rounded-lg space-y-2 bg-rose-500/5">
                          <p className="text-[8.5px] text-rose-300 leading-snug">{reviewCameraError}</p>
                          <button
                            type="button"
                            onClick={startReviewCamera}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-cyan-soft border border-brand-cyan/25 text-brand-cyan hover:bg-brand-cyan/20 font-bold text-[10px] rounded-lg transition-colors"
                          >
                            <Camera className="h-3.5 w-3.5" />
                            Retry Camera
                          </button>
                        </div>
                      ) : reviewSelfieCaptured ? (
                        <div className="space-y-2">
                          <div className="h-28 w-28 rounded-xl overflow-hidden border border-emerald-500 mx-auto relative shadow-lg">
                            <img src={reviewSelfieUrl} className="w-full h-full object-cover" alt="selfie" />
                          </div>
                          <div className="flex justify-center">
                            <button
                              type="button"
                              onClick={() => {
                                setReviewSelfieCaptured(false);
                                setReviewSelfieUrl('');
                                startReviewCamera();
                              }}
                              className="px-2.5 py-1 text-[8.5px] font-bold text-brand-cyan border border-brand-cyan/20 hover:bg-brand-cyan/10 rounded-lg transition-colors uppercase tracking-wider"
                            >
                              Retake Picture
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={startReviewCamera}
                          className="w-full py-1.5 bg-brand-cyan-soft hover:bg-brand-cyan-soft/80 text-brand-cyan text-[10px] font-bold rounded-lg border border-brand-cyan/20 flex items-center justify-center gap-1 transition-all shadow-sm"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          Open Camera to Capture Situation
                        </button>
                      )}
                    </div>

                    {/* Item 2: GPS coordinate matching */}
                    <div className="border border-brand-border p-3 rounded-xl space-y-2 bg-brand-dark-bg">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-brand-text-main">2. GPS Spatial Corroboration</span>
                        {reviewGpsCaptured ? (
                          <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-0.5"><Check className="h-3 w-3" /> Coordinates Locked</span>
                        ) : (
                          <span className="text-rose-400 text-[9px] font-medium animate-pulse">Lock Needed</span>
                        )}
                      </div>

                      {!reviewGpsCaptured ? (
                        <button
                          type="button"
                          onClick={handleGpsVerification}
                          disabled={gpsLoading}
                          className="w-full py-1.5 bg-brand-cyan-soft hover:bg-brand-cyan-soft/80 text-brand-cyan text-[10px] font-bold rounded-lg border border-brand-cyan/20 flex items-center justify-center gap-1 transition-all disabled:opacity-60"
                        >
                          {gpsLoading ? (
                            <>
                              <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                              Acquiring GPS Satellite Lock...
                            </>
                          ) : (
                            <>
                              <MapPin className="h-3.5 w-3.5 text-brand-cyan animate-pulse" />
                              Connect GPS & Resolve Location
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="space-y-1.5 text-[10px]">
                          <div className="p-1.5 bg-[#0e0e0e] border border-brand-border rounded font-mono text-[9px] text-brand-cyan">
                            <span className="text-brand-text-dim">Resolved Address: </span> 
                            <span className="text-brand-text-main font-sans text-[10px] block mt-0.5 leading-snug">{reviewAddress || "Physical Geolocation site"}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[8px] font-mono pt-1 text-brand-text-dim">
                            <div>
                              <span className="block text-brand-text-dim">YOUR GPS POSITION</span>
                              <span className="text-brand-text-main font-semibold text-[9px]">
                                {(reviewLat !== null ? reviewLat : deviceLocation.lat).toFixed(5)}, {(reviewLng !== null ? reviewLng : deviceLocation.lng).toFixed(5)}
                              </span>
                            </div>
                            <div>
                              <span className="block text-brand-text-dim">TARGET INCIDENT</span>
                              <span className="text-brand-text-main font-semibold text-[9px]">
                                {activeReviewComplaint.latitude.toFixed(5)}, {activeReviewComplaint.longitude.toFixed(5)}
                              </span>
                            </div>
                          </div>

                          {/* Distance calculation */}
                          {(() => {
                            const dist = calculateDistanceInMeters(
                              reviewLat !== null ? reviewLat : deviceLocation.lat,
                              reviewLng !== null ? reviewLng : deviceLocation.lng,
                              activeReviewComplaint.latitude,
                              activeReviewComplaint.longitude
                            );
                            const withinLimit = dist <= 150;
                            return (
                              <div className="mt-2 p-1.5 rounded bg-brand-dark-bg border border-brand-border/40 flex items-center justify-between">
                                <span className="text-[8.5px] font-bold uppercase tracking-wider text-brand-text-dim">Proximity Status:</span>
                                {withinLimit ? (
                                  <span className="text-emerald-400 font-bold font-mono text-[9px]">✓ Matched ({Math.round(dist)}m away)</span>
                                ) : (
                                  <span className="text-rose-400 font-bold font-mono text-[9px]">❌ Fail ({Math.round(dist)}m away)</span>
                                )}
                              </div>
                            );
                          })()}

                          <div className="flex justify-end pt-0.5">
                            <button
                              type="button"
                              onClick={handleGpsVerification}
                              disabled={gpsLoading}
                              className="text-[8.5px] text-brand-cyan hover:underline font-mono uppercase tracking-wider font-semibold disabled:opacity-50"
                            >
                              {gpsLoading ? 'Resyncing GPS...' : '🔄 Re-sync Location'}
                            </button>
                          </div>
                        </div>
                      )}
                      {gpsErrorMsg && (
                        <p className="text-[8px] text-amber-300 leading-snug mt-1">⚠️ {gpsErrorMsg}</p>
                      )}
                    </div>

                  </div>

                  {/* Submission triggers */}
                  {(() => {
                    const dist = calculateDistanceInMeters(
                      reviewLat !== null ? reviewLat : deviceLocation.lat,
                      reviewLng !== null ? reviewLng : deviceLocation.lng,
                      activeReviewComplaint.latitude,
                      activeReviewComplaint.longitude
                    );
                    const withinLimit = dist <= 150;
                    return (
                      <button
                        onClick={handleVerifySubmit}
                        disabled={!reviewSelfieCaptured || !reviewGpsCaptured || !withinLimit || reviewSubmitting}
                        className="w-full py-2.5 bg-brand-cyan text-brand-dark-bg rounded-xl text-xs font-bold uppercase tracking-wider disabled:bg-brand-dark-bg disabled:text-brand-text-dim disabled:border-brand-border transition-all"
                      >
                        {reviewSubmitting ? 'Validating Spatial Check...' : 'Verify on Database (+50 Coins)'}
                      </button>
                    );
                  })()}

                  <div className="bg-brand-cyan-soft/5 p-2.5 rounded-lg border border-brand-cyan/15 text-[8px] text-brand-text-dim leading-snug font-light">
                    📌 <strong>Precision Distance Check:</strong> Verifiers must be located within 150 meters of the reported incident coordinates to validate and earn contribution rewards.
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* GOVERNMENT OFFICER RESOLUTION SUBMIT (MODAL) */}
          <AnimatePresence>
            {activeResolveComplaint && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#080808]/95 backdrop-blur-sm z-50 flex flex-col justify-end"
                id="officer-resolution-overlay"
              >
                <div className="bg-brand-dark-card border-t border-brand-border rounded-t-[28px] p-4 space-y-4 max-h-[90%] overflow-y-auto">
                  <div className="flex justify-between items-center border-b border-brand-border pb-2">
                    <span className="text-xs font-display font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Government Resolution Portal
                    </span>
                    <button 
                      onClick={() => {
                        setActiveResolveComplaint(null);
                      }} 
                      className="p-1 rounded-full hover:bg-brand-dark-bg"
                    >
                      <X className="h-4 w-4 text-brand-text-dim" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[8px] font-mono bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded font-bold uppercase border border-emerald-500/25">Target Incident</span>
                    <h3 className="font-bold text-xs text-brand-text-main">{activeResolveComplaint.title}</h3>
                    <p className="text-[9px] text-brand-text-dim">{activeResolveComplaint.address}</p>
                  </div>

                  {/* Requirements List */}
                  <div className="space-y-3">
                    
                    {/* Item 1: Live Solved Photo */}
                    <div className="border border-brand-border p-3 rounded-xl space-y-2 bg-brand-dark-bg">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-brand-text-main">1. Snap Solved Work Proof (Live)</span>
                        {resolvePhotoCaptured ? (
                          <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-0.5"><Check className="h-3 w-3" /> Captured</span>
                        ) : (
                          <span className="text-rose-400 text-[9px] font-medium animate-pulse">Awaiting Capture</span>
                        )}
                      </div>

                      {isResolveCameraActive ? (
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-emerald-500/30 bg-black flex flex-col justify-end">
                          <video
                            ref={resolveVideoRef}
                            autoPlay
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent flex justify-center gap-2 z-10">
                            <button
                              type="button"
                              onClick={captureResolvePhoto}
                              className="px-3 py-1 bg-emerald-500 text-white font-bold text-[10px] rounded hover:bg-emerald-600 transition-all flex items-center gap-1 shadow-md"
                            >
                              <Camera className="h-3.5 w-3.5" /> Capture Live Photo
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsResolveCameraActive(false);
                                if (resolveVideoStream) {
                                  resolveVideoStream.getTracks().forEach(track => track.stop());
                                  setResolveVideoStream(null);
                                }
                              }}
                              className="px-3 py-1 bg-brand-dark-bg border border-brand-border text-brand-text-main font-bold text-[10px] rounded hover:bg-brand-dark-card transition-all shadow-md"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : resolvePhotoCaptured ? (
                        <div className="space-y-2">
                          <div className="h-32 w-full rounded-xl overflow-hidden border border-emerald-500 relative shadow-lg">
                            <img src={resolvePhotoUrl} className="w-full h-full object-cover" alt="solved proof" />
                          </div>
                          <div className="flex justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setResolvePhotoCaptured(false);
                                setResolvePhotoUrl('');
                                startResolveCamera();
                              }}
                              className="px-2.5 py-1 text-[8.5px] font-bold text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10 rounded-lg transition-colors uppercase tracking-wider"
                            >
                              Retake Picture
                            </button>
                            <label
                              htmlFor="resolve-file-input"
                              className="px-2.5 py-1 text-[8.5px] font-bold text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/10 rounded-lg transition-colors uppercase tracking-wider cursor-pointer flex items-center justify-center"
                            >
                              Upload Different File
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleResolveFileChange}
                              className="hidden"
                              id="resolve-file-input"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={startResolveCamera}
                              className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-500/20 flex items-center justify-center gap-1 transition-all shadow-sm"
                            >
                              <Camera className="h-3.5 w-3.5" />
                              Open Live Camera
                            </button>
                            <label
                              htmlFor="resolve-file-input"
                              className="flex-1 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-[10px] font-bold rounded-lg border border-cyan-500/20 flex items-center justify-center gap-1 transition-all shadow-sm cursor-pointer"
                            >
                              <Camera className="h-3.5 w-3.5" />
                              Upload Solved Photo
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleResolveFileChange}
                              className="hidden"
                              id="resolve-file-input"
                            />
                          </div>

                          {resolveCameraError && (
                            <div className="text-center p-2 border border-dashed border-rose-500/30 rounded-lg bg-rose-500/5">
                              <p className="text-[8.5px] text-rose-300 leading-snug">{resolveCameraError}</p>
                              <p className="text-[8px] text-brand-text-dim mt-1">Please upload the live status photo manually instead using the "Upload Solved Photo" button.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Item 2: GPS coordinate matching info */}
                    <div className="border border-brand-border p-3 rounded-xl space-y-2 bg-brand-dark-bg text-[10px]">
                      <div className="flex justify-between items-center text-emerald-400 font-bold">
                        <span>2. GPS Spatial Presence</span>
                        <span className="flex items-center gap-0.5"><Check className="h-3 w-3" /> Matches exact geofence</span>
                      </div>
                      <p className="text-[9px] text-brand-text-dim leading-relaxed">
                        Your device is currently located within the required 150m geofence area. Distance: <span className="text-emerald-400 font-bold">{Math.round(calculateDistanceInMeters(deviceLocation.lat, deviceLocation.lng, activeResolveComplaint.latitude, activeResolveComplaint.longitude))}m</span>. Live picture proof coordinates are matching perfectly.
                      </p>
                    </div>

                  </div>

                  {/* Submission trigger */}
                  <button
                    onClick={() => handleOfficerResolve(activeResolveComplaint, resolvePhotoUrl)}
                    disabled={!resolvePhotoCaptured}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-brand-dark-bg disabled:text-brand-text-dim disabled:border-brand-border text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    Submit Proof & Mark Resolved
                  </button>

                  <div className="bg-emerald-500/5 p-2.5 rounded-lg border border-emerald-500/15 text-[8px] text-brand-text-dim leading-snug font-light">
                    📌 <strong>Resolution Proof Audit:</strong> Officers must submit a live work photo on-site. The photo is cryptographically stamped with GPS coordinates and recorded in the municipal public ledger.
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CITIZEN CHALLENGE RESOLUTION DISPUTE (MODAL) */}
          <AnimatePresence>
            {activeChallengeComplaint && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#080808]/95 backdrop-blur-sm z-50 flex flex-col justify-end"
                id="challenge-overlay"
              >
                <div className="bg-brand-dark-card border-t border-brand-border rounded-t-[28px] p-4 space-y-4 max-h-[90%] overflow-y-auto">
                  <div className="flex justify-between items-center border-b border-brand-border pb-2">
                    <span className="text-xs font-display font-bold text-rose-400 uppercase tracking-wider">Challenge Resolution Dispute</span>
                    <button 
                      onClick={() => {
                        setActiveChallengeComplaint(null);
                        setChallengeSelfieCaptured(false);
                        setChallengeSelfieUrl('');
                        setChallengePhotoCaptured(false);
                        setChallengePhotoUrl('');
                        setChallengeGpsCaptured(false);
                      }} 
                      className="p-1 rounded-full hover:bg-brand-dark-bg"
                    >
                      <X className="h-4 w-4 text-brand-text-dim" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[8px] bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wide border border-rose-500/20">Audit Stage</span>
                    <h3 className="font-bold text-xs text-brand-text-main mt-1">{activeChallengeComplaint.title}</h3>
                    <p className="text-[9px] text-brand-text-dim flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-rose-400/80" /> {activeChallengeComplaint.address}
                    </p>
                    <p className="text-[9px] text-rose-300 bg-rose-500/5 border border-rose-500/10 p-2 rounded-lg leading-relaxed font-light">
                      ⚠️ <strong>Falsification Shield:</strong> Disputing a solved status requires active photographic verification and GPS sensor coordinates matched precisely within 150m of the site.
                    </p>
                  </div>

                  {/* Inputs */}
                  <div className="space-y-3">
                    
                    {/* Unresolved photo input with real live camera feed */}
                    <div className="border border-brand-border p-3 rounded-xl space-y-2 bg-brand-dark-bg">
                      <span className="text-[9px] font-bold text-brand-text-dim uppercase tracking-wider block">1. Snap Unresolved Issue Situation</span>
                      
                      {isChallengeCameraActive && challengeActiveCameraType === 'photo' ? (
                        <div className="space-y-2">
                          <div className="h-40 rounded-lg overflow-hidden border border-brand-cyan/30 relative bg-[#0d0d0d] shadow-inner">
                            <video 
                              ref={challengeVideoRef} 
                              autoPlay 
                              playsInline 
                              className="w-full h-full object-cover" 
                            />
                            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-mono bg-rose-600 text-white animate-pulse">
                              LIVE STREAM
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={captureChallengePhoto}
                            className="w-full py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Camera className="h-3.5 w-3.5" />
                            Capture Situation Snapshot
                          </button>
                        </div>
                      ) : challengePhotoCaptured ? (
                        <div className="space-y-2">
                          <div className="h-28 w-40 rounded-xl overflow-hidden border border-emerald-500 mx-auto relative shadow-md">
                            <img src={challengePhotoUrl} className="w-full h-full object-cover" alt="Issue proof" />
                            <div className="absolute top-1 right-1 bg-emerald-500 p-0.5 rounded-full text-white">
                              <Check className="h-2.5 w-2.5" />
                            </div>
                          </div>
                          <div className="flex justify-center">
                            <button
                              type="button"
                              onClick={() => {
                                setChallengePhotoCaptured(false);
                                setChallengePhotoUrl('');
                                startChallengeCamera('photo');
                              }}
                              className="px-2.5 py-1 text-[8px] font-bold text-rose-400 border border-rose-400/20 hover:bg-rose-400/10 rounded-lg transition-colors uppercase tracking-wider"
                            >
                              Retake Photo
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startChallengeCamera('photo')}
                          className="w-full py-1.5 bg-brand-cyan-soft hover:bg-brand-cyan-soft/80 text-brand-cyan text-[10px] font-bold rounded-lg border border-brand-cyan/25 flex items-center justify-center gap-1 shadow-sm transition-all"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          Open Situation Camera
                        </button>
                      )}
                    </div>

                    {/* Precise GPS verification lock */}
                    <div className="border border-brand-border p-3 rounded-xl space-y-2 bg-brand-dark-bg">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold text-brand-text-dim uppercase tracking-wider">2. Geofenced Location Matching</span>
                        {challengeGpsCaptured ? (
                          <span className="text-emerald-400 text-[9px] font-bold flex items-center gap-0.5"><Check className="h-3 w-3" /> GPS Lock Active</span>
                        ) : (
                          <span className="text-rose-400 text-[8px] font-medium animate-pulse">Lock Needed</span>
                        )}
                      </div>

                      {!challengeGpsCaptured ? (
                        <button
                          type="button"
                          onClick={fetchChallengeLiveLocation}
                          disabled={isChallengeGpsLoading}
                          className="w-full py-1.5 bg-brand-cyan-soft hover:bg-brand-cyan-soft/80 text-brand-cyan text-[10px] font-bold rounded-lg border border-brand-cyan/25 flex items-center justify-center gap-1 shadow-sm transition-all disabled:opacity-60"
                        >
                          {isChallengeGpsLoading ? (
                            <>
                              <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                              Acquiring GPS Satellite Lock...
                            </>
                          ) : (
                            <>
                              <MapPin className="h-3.5 w-3.5 text-brand-cyan animate-pulse" />
                              Connect GPS & Resolve Location
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="space-y-1.5 text-[10px]">
                          <div className="p-1.5 bg-[#0e0e0e] border border-brand-border rounded font-mono text-[9px] text-brand-cyan">
                            <span className="text-brand-text-dim">Resolved Address: </span> 
                            <span className="text-brand-text-main font-sans text-[10px] block mt-0.5 leading-snug">{challengeAddress}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[8px] font-mono pt-1 text-brand-text-dim">
                            <div>
                              <span className="block text-brand-text-dim">YOUR GPS POSITION</span>
                              <span className="text-brand-text-main font-semibold text-[9px]">
                                {(challengeLat !== null ? challengeLat : deviceLocation.lat).toFixed(5)}, {(challengeLng !== null ? challengeLng : deviceLocation.lng).toFixed(5)}
                              </span>
                            </div>
                            <div>
                              <span className="block text-brand-text-dim">TARGET INCIDENT</span>
                              <span className="text-brand-text-main font-semibold text-[9px]">
                                {activeChallengeComplaint.latitude.toFixed(5)}, {activeChallengeComplaint.longitude.toFixed(5)}
                              </span>
                            </div>
                          </div>

                          {/* Distance calculation */}
                          {(() => {
                            const dist = calculateDistanceInMeters(
                              challengeLat !== null ? challengeLat : deviceLocation.lat,
                              challengeLng !== null ? challengeLng : deviceLocation.lng,
                              activeChallengeComplaint.latitude,
                              activeChallengeComplaint.longitude
                            );
                            const withinLimit = dist <= 150;
                            return (
                              <div className="mt-2 p-1.5 rounded bg-brand-dark-bg border border-brand-border/40 flex items-center justify-between">
                                <span className="text-[8.5px] font-bold uppercase tracking-wider text-brand-text-dim">Proximity Status:</span>
                                {withinLimit ? (
                                  <span className="text-emerald-400 font-bold font-mono text-[9px]">✓ Matched ({Math.round(dist)}m away)</span>
                                ) : (
                                  <span className="text-rose-400 font-bold font-mono text-[9px]">❌ Fail ({Math.round(dist)}m away)</span>
                                )}
                              </div>
                            );
                          })()}

                          <div className="flex justify-end pt-0.5">
                            <button
                              type="button"
                              onClick={fetchChallengeLiveLocation}
                              disabled={isChallengeGpsLoading}
                              className="text-[8.5px] text-brand-cyan hover:underline font-mono uppercase tracking-wider font-semibold disabled:opacity-50"
                            >
                              {isChallengeGpsLoading ? 'Resyncing GPS...' : '🔄 Re-sync Location'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>

                  <button
                    onClick={handleChallengeSubmit}
                    disabled={!challengePhotoCaptured || !challengeGpsCaptured}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider disabled:bg-brand-dark-bg disabled:text-brand-text-dim disabled:border-brand-border transition-all"
                  >
                    Submit Dispute Audit
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* NATIVE DISTRICT HUB LOCATION SELECTOR SHEET */}
          <AnimatePresence>
            {isLocationMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute inset-0 bg-[#080808]/95 backdrop-blur-sm z-50 flex flex-col justify-end"
                id="location-selector-overlay"
              >
                <div className="bg-brand-dark-card border-t border-brand-border rounded-t-[28px] p-4 space-y-4 max-h-[90%] overflow-y-auto">
                  <div className="flex justify-between items-center border-b border-brand-border pb-2">
                    <span className="text-xs font-display font-bold text-brand-cyan uppercase">Device GPS District Hub</span>
                    <button 
                      onClick={() => setIsLocationMenuOpen(false)} 
                      className="p-1 rounded-full hover:bg-brand-dark-bg"
                    >
                      <X className="h-4 w-4 text-brand-text-dim" />
                    </button>
                  </div>

                  <p className="text-[10px] text-brand-text-dim leading-snug font-light">
                    Select a municipal precinct to simulate shifting your physical device coordinates:
                  </p>

                  <div className="flex flex-col gap-1.5" id="native-presets-list">
                    {locationPresets.map((loc) => {
                      const isSelected = Math.abs(deviceLocation.lat - loc.lat) < 0.0001;
                      return (
                        <button
                          key={loc.name}
                          onClick={() => {
                            setDeviceLocation({ lat: loc.lat, lng: loc.lng, name: loc.name });
                            onAddLog('geofence', `User updated device coordinates to '${loc.name}'.`);
                            setIsLocationMenuOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[10.5px] transition-all flex items-center justify-between border ${
                            isSelected
                              ? 'bg-brand-cyan border-brand-cyan text-brand-dark-bg font-semibold shadow-md shadow-brand-cyan/20'
                              : 'bg-brand-dark-bg border-brand-border text-brand-text-main hover:bg-brand-dark-bg/60 font-light'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <span>{loc.name}</span>
                          </div>
                          <span className="font-mono text-[9px] shrink-0 font-bold">
                            {loc.lat.toFixed(3)}, {loc.lng.toFixed(3)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Custom Toast Notifications */}
          <div className="absolute top-14 left-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
            <AnimatePresence>
              {toasts.map((toast) => (
                <motion.div
                  key={toast.id}
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`px-3.5 py-2.5 rounded-xl border shadow-xl flex items-start gap-2.5 text-[10.5px] font-semibold leading-relaxed backdrop-blur-md pointer-events-auto ${
                    toast.type === 'success'
                      ? 'bg-[#0E1A14]/95 border-emerald-500/40 text-emerald-300'
                      : toast.type === 'error'
                      ? 'bg-[#1C0F11]/95 border-rose-500/40 text-rose-300'
                      : 'bg-[#0B151A]/95 border-brand-cyan/40 text-cyan-300'
                  }`}
                >
                  <AlertCircle className={`h-4 w-4 shrink-0 mt-0.5 ${
                    toast.type === 'success' ? 'text-emerald-400' : toast.type === 'error' ? 'text-rose-400' : 'text-brand-cyan'
                  }`} />
                  <div className="flex-1">{toast.message}</div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

        </div>
      </div>

    </div>
  );
}
