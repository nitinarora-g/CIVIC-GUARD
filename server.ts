import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import dotenv from "dotenv";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

// Initialize Google GenAI client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const firebaseConfig = {
  projectId: "gen-lang-client-0667728795",
  appId: "1:891914187227:web:091d306c17e307cac737fe",
  apiKey: "AIzaSyBPK0VcUEdFD5NP0gIv_emgZlwlsNTjXAw",
  authDomain: "gen-lang-client-0667728795.firebaseapp.com",
  storageBucket: "gen-lang-client-0667728795.firebasestorage.app",
  messagingSenderId: "891914187227"
};

const firebaseApp = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(firebaseApp, "ai-studio-civiccomplainttr-9be32a01-6c26-457e-a386-c0d6dc0687e2");

let memoryDb: DbSchema | null = null;


// Temporary storage for OTPs (in-memory)
// Keys are lowercase email or formatted phone, values are { otp: string, expiresAt: number }
interface OtpStoreItem {
  otp: string;
  expiresAt: number;
}
const otpStorage = new Map<string, OtpStoreItem>();

interface UserProfile {
  id: string;
  emailOrPhone: string;
  fullName: string;
  role: 'citizen' | 'officer';
  coinBalance: number;
  createdAt: string;
  state?: string;
  district?: string;
  username?: string;
  avatarUrl?: string;
}

interface Complaint {
  id: string;
  reporterId: string;
  reporterName: string;
  title: string;
  description: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  address: string;
  state: string;
  district: string;
  status: 'pending' | 'resolved';
  verificationsCount: number;
  verifiedUserIds: string[];
  resolvedBy?: string;
  resolvedPhotoUrl?: string;
  resolvedAt?: string;
  createdAt: string;
}

interface ChatRoom {
  id: string;
  complaintId: string;
  complaintTitle: string;
  citizenId: string;
  citizenName: string;
  lastMessage?: string;
  lastMessageAt?: string;
}

interface Message {
  id: string;
  chatRoomId: string;
  senderId: string;
  senderName: string;
  senderRole: 'citizen' | 'officer';
  content: string;
  createdAt: string;
}

interface DbSchema {
  users: Record<string, UserProfile>;
  complaints: Complaint[];
  chatRooms: ChatRoom[];
  allMessages: Record<string, Message[]>;
}

const DB_FILE = path.join(process.cwd(), "database.json");

const initialComplaintsSeed: Complaint[] = [
  {
    id: 'comp_101',
    reporterId: 'user_1',
    reporterName: 'Rahul Sharma',
    title: 'Severe Waterlogging & Broken Drainage',
    description: 'The sewage drain near Connaught Place Radial 3 is completely choked. Rainwater has pooled to almost 1.5 feet, making the road completely impassable and causing massive traffic jams. Immediate clearance of the main drain line is required.',
    imageUrl: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
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
    imageUrl: 'https://images.unsplash.com/photo-1558486012-817176f84c6d?auto=format&fit=crop&w=600&q=80',
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
    imageUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80',
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
    imageUrl: 'https://images.unsplash.com/photo-1597241285493-27c191140924?auto=format&fit=crop&w=600&q=80',
    latitude: 28.6441,
    longitude: 77.1895,
    address: 'Padam Singh Road Crossroad, Karol Bagh, New Delhi - 110005',
    state: 'Delhi',
    district: 'Central Delhi',
    status: 'pending',
    verificationsCount: 5,
    verifiedUserIds: ['u1', 'u2', 'u3', 'u4', 'u5'],
    resolvedBy: 'Officer Amit Kumar',
    resolvedPhotoUrl: 'https://images.unsplash.com/photo-1599740831114-171d111e40a0?auto=format&fit=crop&w=600&q=80',
    resolvedAt: '2026-06-25T18:00:00Z',
    createdAt: '2026-06-24T10:00:00Z'
  }
];

const initialChatRoomsSeed: ChatRoom[] = [
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

const initialMessagesSeed: Record<string, Message[]> = {
  'chat_101': [
    {
      id: 'm_1',
      chatRoomId: 'chat_101',
      senderId: 'user_1',
      senderName: 'Rahul Sharma',
      senderRole: 'citizen',
      content: 'Hello, I reported this broken drain this morning. The water level is increasing due to the rains.',
      createdAt: '2026-06-25T08:30:00Z'
    },
    {
      id: 'm_2',
      chatRoomId: 'chat_101',
      senderId: 'system',
      senderName: 'System Gatekeeper',
      senderRole: 'officer',
      content: 'New Delhi District Control Room: Assigned to Connaught Place Division.',
      createdAt: '2026-06-25T09:00:00Z'
    },
    {
      id: 'm_3',
      chatRoomId: 'chat_101',
      senderId: 'user_2',
      senderName: 'Amit Kumar',
      senderRole: 'officer',
      content: 'Hello Rahul, I have received the alert. Our ground team is wrapping up clearing another sector and will inspect CP radial 3 next.',
      createdAt: '2026-06-25T11:20:00Z'
    },
    {
      id: 'm_4',
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
      id: 'm_5',
      chatRoomId: 'chat_102',
      senderId: 'user_3',
      senderName: 'Priya Patel',
      senderRole: 'citizen',
      content: 'High-voltage wire is hanging extremely low. This needs immediate insulation or power cutoff.',
      createdAt: '2026-06-25T14:45:00Z'
    },
    {
      id: 'm_6',
      chatRoomId: 'chat_102',
      senderId: 'system',
      senderName: 'System Gatekeeper',
      senderRole: 'officer',
      content: 'Assigned to Power Distribution Dept, New Delhi division.',
      createdAt: '2026-06-25T15:10:00Z'
    },
    {
      id: 'm_7',
      chatRoomId: 'chat_102',
      senderId: 'user_3',
      senderName: 'Priya Patel',
      senderRole: 'citizen',
      content: 'Officer, please look into this urgently. Children play here in the evening.',
      createdAt: '2026-06-25T17:20:00Z'
    }
  ]
};

const initialUsersSeed: Record<string, UserProfile> = {
  '9876543210': {
    id: 'user_1',
    emailOrPhone: '9876543210',
    fullName: 'Rahul Sharma',
    role: 'citizen',
    coinBalance: 350,
    createdAt: '2026-05-10T12:00:00Z',
    username: 'rahul_sharma',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
  },
  'amit.kumar@gov.in': {
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

async function saveToFirestoreFull(db: DbSchema) {
  try {
    for (const [key, user] of Object.entries(db.users)) {
      await setDoc(doc(firestoreDb, "users", key), user);
    }
    for (const comp of db.complaints) {
      await setDoc(doc(firestoreDb, "complaints", comp.id), comp);
    }
    for (const room of db.chatRooms) {
      await setDoc(doc(firestoreDb, "chatRooms", room.id), room);
    }
    for (const [chatRoomId, messages] of Object.entries(db.allMessages)) {
      await setDoc(doc(firestoreDb, "allMessages", chatRoomId), { messages });
    }
    console.log("[FIRESTORE] Synchronized to cloud Firestore successfully.");
  } catch (err) {
    console.error("[FIRESTORE] Full cloud sync failed:", err);
  }
}

async function initDb() {
  console.log("[FIRESTORE] Connecting to Firestore...");
  try {
    const usersSnapshot = await getDocs(collection(firestoreDb, "users"));
    const complaintsSnapshot = await getDocs(collection(firestoreDb, "complaints"));
    const chatRoomsSnapshot = await getDocs(collection(firestoreDb, "chatRooms"));
    const allMessagesSnapshot = await getDocs(collection(firestoreDb, "allMessages"));

    if (usersSnapshot.empty && complaintsSnapshot.empty) {
      console.log("[FIRESTORE] Firestore is empty. Initializing with seeds...");
      const defaultDb: DbSchema = {
        users: initialUsersSeed,
        complaints: initialComplaintsSeed,
        chatRooms: initialChatRoomsSeed,
        allMessages: initialMessagesSeed
      };
      
      memoryDb = defaultDb;
      await saveToFirestoreFull(defaultDb);
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), "utf-8");
      console.log("[FIRESTORE] Seeding completed.");
    } else {
      console.log("[FIRESTORE] Pulling existing records from cloud Firestore...");
      const users: Record<string, UserProfile> = {};
      usersSnapshot.forEach(doc => {
        users[doc.id] = doc.data() as UserProfile;
      });

      const complaints: Complaint[] = [];
      complaintsSnapshot.forEach(doc => {
        complaints.push(doc.data() as Complaint);
      });

      const chatRooms: ChatRoom[] = [];
      chatRoomsSnapshot.forEach(doc => {
        chatRooms.push(doc.data() as ChatRoom);
      });

      const allMessages: Record<string, Message[]> = {};
      allMessagesSnapshot.forEach(doc => {
        allMessages[doc.id] = (doc.data().messages || []) as Message[];
      });

      memoryDb = {
        users: Object.keys(users).length ? users : initialUsersSeed,
        complaints: complaints.length ? complaints : initialComplaintsSeed,
        chatRooms: chatRooms.length ? chatRooms : initialChatRoomsSeed,
        allMessages: Object.keys(allMessages).length ? allMessages : initialMessagesSeed
      };

      fs.writeFileSync(DB_FILE, JSON.stringify(memoryDb, null, 2), "utf-8");
      console.log("[FIRESTORE] Loaded database successfully from Firestore.");
    }
  } catch (err) {
    console.error("[FIRESTORE] Connection error. Falling back to local cache:", err);
    if (fs.existsSync(DB_FILE)) {
      try {
        const data = fs.readFileSync(DB_FILE, "utf-8");
        memoryDb = JSON.parse(data);
      } catch (e) {
        console.error("[FIRESTORE] Local parse failed:", e);
      }
    }
    if (!memoryDb) {
      memoryDb = {
        users: initialUsersSeed,
        complaints: initialComplaintsSeed,
        chatRooms: initialChatRoomsSeed,
        allMessages: initialMessagesSeed
      };
    }
  }
}

function loadDb(): DbSchema {
  if (!memoryDb) {
    try {
      if (fs.existsSync(DB_FILE)) {
        const data = fs.readFileSync(DB_FILE, "utf-8");
        memoryDb = JSON.parse(data);
      }
    } catch (err) {
      console.error("[FIRESTORE] Failed to load local cache synchronously:", err);
    }
    if (!memoryDb) {
      memoryDb = {
        users: initialUsersSeed,
        complaints: initialComplaintsSeed,
        chatRooms: initialChatRoomsSeed,
        allMessages: initialMessagesSeed
      };
    }
  }
  return memoryDb;
}

function saveDb(db: DbSchema) {
  memoryDb = db;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save database.json:", err);
  }
  
  saveToFirestoreFull(db).catch(err => {
    console.error("[FIRESTORE] Asynchronous cloud save failed:", err);
  });
}


function getUser(emailOrPhone: string): UserProfile | undefined {
  const db = loadDb();
  return db.users[emailOrPhone.trim().toLowerCase()];
}

function saveUser(emailOrPhone: string, user: UserProfile) {
  const db = loadDb();
  db.users[emailOrPhone.trim().toLowerCase()] = user;
  saveDb(db);
}

function getAllUsers(): Record<string, UserProfile> {
  const db = loadDb();
  return db.users;
}


// Cache for Nodemailer Ethereal Test Account to avoid creating it on every single request
let cachedEtherealTransporter: nodemailer.Transporter | null = null;

async function getEtherealTransporter(): Promise<nodemailer.Transporter> {
  if (cachedEtherealTransporter) {
    return cachedEtherealTransporter;
  }
  console.log("Generating Ethereal SMTP test credentials...");
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });
  cachedEtherealTransporter = transporter;
  return transporter;
}

async function startServer() {
  // Initialize cloud Firestore database before booting the server
  await initDb();

  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON request bodies
  app.use(express.json());

  // API Route: Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Helper to convert an image input (base64 data URL or HTTP/HTTPS URL) to Gemini's inlineData format
  async function getImagePart(input: string): Promise<{ inlineData: { mimeType: string; data: string } }> {
    if (!input) {
      throw new Error("Empty image input");
    }
    // Check if it is a base64 data URL
    if (input.startsWith("data:")) {
      const match = input.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        return {
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        };
      }
    }

    // Otherwise, assume it is an HTTP/HTTPS URL
    try {
      const response = await fetch(input);
      if (!response.ok) {
        throw new Error(`Failed to fetch image from URL: ${input}`);
      }
      const contentType = response.headers.get("content-type") || "image/jpeg";
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      return {
        inlineData: {
          mimeType: contentType,
          data: base64,
        },
      };
    } catch (error) {
      console.error(`Error fetching and encoding image URL (${input}):`, error);
      throw error;
    }
  }

  // API Route: Compare original complaint photo with verification/resolution photo
  app.post("/api/compare-images", async (req, res) => {
    try {
      const { image1, image2 } = req.body;
      if (!image1 || !image2) {
        return res.status(400).json({ error: "Both image1 and image2 are required for comparison." });
      }

      console.log("[AI SIMID] Converting images to base64 inline parts...");
      const part1 = await getImagePart(image1);
      const part2 = await getImagePart(image2);

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          similarityScore: {
            type: Type.INTEGER,
            description: "Similarity score between 0 and 100 based on physical features."
          },
          isMatch: {
            type: Type.BOOLEAN,
            description: "True if similarityScore is >= 80, meaning it is a likely match for the exact same physical spot."
          },
          reasoning: {
            type: Type.STRING,
            description: "A professional analysis of why the images represent the same location or not."
          },
          features: {
            type: Type.OBJECT,
            properties: {
              road_shape: {
                type: Type.OBJECT,
                properties: {
                  matched: { type: Type.BOOLEAN },
                  details: { type: Type.STRING, description: "Analysis of the road layout, curbs, or turns." }
                },
                required: ["matched", "details"]
              },
              buildings: {
                type: Type.OBJECT,
                properties: {
                  matched: { type: Type.BOOLEAN },
                  details: { type: Type.STRING, description: "Analysis of surrounding building structures, windows, walls, colors." }
                },
                required: ["matched", "details"]
              },
              trees: {
                type: Type.OBJECT,
                properties: {
                  matched: { type: Type.BOOLEAN },
                  details: { type: Type.STRING, description: "Analysis of tree placements, foliage, greenery." }
                },
                required: ["matched", "details"]
              },
              electric_poles: {
                type: Type.OBJECT,
                properties: {
                  matched: { type: Type.BOOLEAN },
                  details: { type: Type.STRING, description: "Analysis of utility poles, wires, lamp posts." }
                },
                required: ["matched", "details"]
              },
              drain_covers: {
                type: Type.OBJECT,
                properties: {
                  matched: { type: Type.BOOLEAN },
                  details: { type: Type.STRING, description: "Analysis of sewer/drain grates, manholes, gutters." }
                },
                required: ["matched", "details"]
              },
              footpaths: {
                type: Type.OBJECT,
                properties: {
                  matched: { type: Type.BOOLEAN },
                  details: { type: Type.STRING, description: "Analysis of sidewalks, pavement patterns, walkway edges." }
                },
                required: ["matched", "details"]
              },
              landmarks: {
                type: Type.OBJECT,
                properties: {
                  matched: { type: Type.BOOLEAN },
                  details: { type: Type.STRING, description: "Analysis of specific signs, banners, shopfronts, or unique structural features." }
                },
                required: ["matched", "details"]
              }
            },
            required: [
              "road_shape",
              "buildings",
              "trees",
              "electric_poles",
              "drain_covers",
              "footpaths",
              "landmarks"
            ]
          }
        },
        required: ["similarityScore", "isMatch", "reasoning", "features"]
      };

      const systemInstruction = `You are a forensic civil engineer and GIS location verification expert.
Your task is to compare two images:
Image 1 is the original complaint photo (when a civic issue was first reported).
Image 2 is the resolution/audit photo (taken to prove the issue is fixed or to audit the spot).

Analyze if both photos were taken at the exact same physical geographic spot (from a similar or slightly different angle).
Specifically inspect and match these 7 visual elements:
1. Road shape (curbs, turns, asphalt patterns, width)
2. Buildings (architecture, windows, doors, walls, colors, surrounding shopfronts)
3. Trees (species, placement, background foliage)
4. Electric poles (utility poles, lamp posts, wires, transformers)
5. Drain covers (sewer grates, manholes, gutter style)
6. Footpaths (sidewalk tiles, paving stones, pedestrian walkways)
7. Landmarks (specific signs, billboards, unique static objects)

Assign matching status (matched: true/false) and details for each element.
Calculate an overall location similarity score between 0 and 100.
If the score is >= 80, set isMatch: true. Otherwise set isMatch: false.
Be objective and strict. If they are completely different streets, similarityScore should be very low (e.g., < 30).`;

      console.log("[AI SIMID] Sending request to Gemini 3.5-flash...");
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          part1,
          part2,
          { text: "Please compare these two images for location similarity and visual features." }
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty response from Gemini");
      }

      const result = JSON.parse(text);
      console.log("[AI SIMID] Gemini comparison result:", result);
      res.json(result);

    } catch (error: any) {
      console.error("Error in compare-images API:", error);
      res.status(500).json({ error: error?.message || "Internal server error during image comparison." });
    }
  });

  // API Route: Verify OTP
  app.post("/api/verify-otp", (req, res) => {
    try {
      const { emailOrPhone, otpInput, role } = req.body;
      if (!emailOrPhone || !otpInput) {
        return res.status(400).json({ error: "Input identity and verification code are required" });
      }

      const normalizedInput = emailOrPhone.trim().toLowerCase();
      
      if (role === "officer") {
        if (!normalizedInput.includes("@") || !normalizedInput.endsWith("gov.in")) {
          return res.status(400).json({ error: "Government employees must log in with an official email ending with gov.in" });
        }
      }
      
      // Allow any 4-digit code to bypass and successfully log in
      const isAnyFourDigitOtp = /^\d{4}$/.test(otpInput);

      if (!isAnyFourDigitOtp) {
        return res.status(400).json({ error: "Invalid code format. Please enter any 4-digit number to log in." });
      }

      // Remove pending verification from map if it exists
      otpStorage.delete(normalizedInput);

      console.log(`[AUTH] Identity verified successfully (Bypass Active): ${normalizedInput} (${role})`);

      let user = getUser(normalizedInput);

      if (user) {
        // Return existing user
        console.log(`[AUTH] Retrieved existing profile for ${normalizedInput}:`, user);
        const onboardPending = user.role === "officer" && (!user.district || !user.state);
        return res.json({
          success: true,
          onboardPending,
          user
        });
      } else {
        // Register new user profile in database
        const isEmail = normalizedInput.includes("@");
        const defaultName = isEmail ? normalizedInput.split("@")[0] : `Citizen_${normalizedInput.slice(-4) || 'User'}`;
        
        const newUser: UserProfile = {
          id: `usr_${Date.now()}`,
          emailOrPhone: normalizedInput,
          fullName: defaultName,
          role: role || "citizen",
          coinBalance: role === "officer" ? 0 : 200,
          createdAt: new Date().toISOString()
        };

        saveUser(normalizedInput, newUser);
        console.log(`[AUTH] Registered new profile for ${normalizedInput}:`, newUser);

        const onboardPending = role === "officer";

        return res.json({
          success: true,
          onboardPending,
          user: newUser
        });
      }

    } catch (error) {
      console.error("Error in verify-otp API:", error);
      res.status(500).json({ error: "Internal server error during verification check" });
    }
  });

  // API Route: Google Login for Citizen
  app.post("/api/google-login", (req, res) => {
    try {
      const email = req.body.email || "nitinarora5969@gmail.com";
      const fullName = req.body.fullName || "Nitin Arora";
      const normalizedInput = email.toLowerCase().trim();
      let user = getUser(normalizedInput);

      if (!user) {
        const cleanName = fullName.replace(/\s+/g, '').toLowerCase();
        const randNum = Math.floor(100 + Math.random() * 900);
        user = {
          id: `usr_g_${cleanName}_${randNum}`,
          emailOrPhone: normalizedInput,
          fullName: fullName,
          role: "citizen",
          coinBalance: 200,
          avatarUrl: `https://unavatar.io/google/${encodeURIComponent(normalizedInput)}`,
          createdAt: new Date().toISOString()
        };
        saveUser(normalizedInput, user);
      }

      return res.json({
        success: true,
        user
      });
    } catch (error) {
      console.error("Error in google-login API:", error);
      res.status(500).json({ error: "Internal server error during Google Sign-In" });
    }
  });

  // API Route: Update User Profile
  app.post("/api/update-profile", (req, res) => {
    try {
      const { emailOrPhone, fullName, username, avatarUrl, state, district, coinBalance } = req.body;
      if (!emailOrPhone) {
        return res.status(400).json({ error: "User identity is required to update profile" });
      }

      const normalizedInput = emailOrPhone.trim().toLowerCase();
      let user = getUser(normalizedInput);

      if (!user) {
        user = {
          id: `usr_${Date.now()}`,
          emailOrPhone: normalizedInput,
          fullName: fullName || "Citizen User",
          role: "citizen",
          coinBalance: coinBalance !== undefined ? coinBalance : 200,
          createdAt: new Date().toISOString()
        };
      }

      // Check username uniqueness across all accounts
      if (username) {
        const trimmedUsername = username.trim().toLowerCase();
        const allUsers = getAllUsers();
        for (const key of Object.keys(allUsers)) {
          const u = allUsers[key];
          if (key !== normalizedInput && u.username?.toLowerCase() === trimmedUsername) {
            return res.status(400).json({ error: `Username '@${trimmedUsername}' is already taken.` });
          }
        }
        user.username = trimmedUsername;
      } else if (username === "") {
        user.username = undefined;
      }

      if (fullName) {
        user.fullName = fullName.trim();
      }

      if (avatarUrl !== undefined) {
        user.avatarUrl = avatarUrl;
      }

      if (state !== undefined) {
        user.state = state;
      }

      if (district !== undefined) {
        user.district = district;
      }

      if (coinBalance !== undefined) {
        user.coinBalance = coinBalance;
      }

      saveUser(normalizedInput, user);
      console.log(`[DATABASE] Profile updated for ${normalizedInput}:`, user);

      return res.json({
        success: true,
        user
      });

    } catch (error) {
      console.error("Error in update-profile API:", error);
      res.status(500).json({ error: "Internal server error during profile update" });
    }
  });

  // API Route: Get all complaints
  app.get("/api/complaints", (req, res) => {
    try {
      const db = loadDb();
      const sorted = [...db.complaints].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json(sorted);
    } catch (error) {
      console.error("Error fetching complaints:", error);
      res.status(500).json({ error: "Failed to fetch complaints" });
    }
  });

  // API Route: Get Leaderboard (Top 50 citizens by resolved reports & coins)
  app.get("/api/leaderboard", (req, res) => {
    try {
      const db = loadDb();
      const users = db.users;
      const complaints = db.complaints;

      // Group resolved complaints by reporterId
      const resolvedCounts: Record<string, number> = {};
      complaints.forEach((comp) => {
        if (comp.status === 'resolved') {
          resolvedCounts[comp.reporterId] = (resolvedCounts[comp.reporterId] || 0) + 1;
        }
      });

      // Filter and map citizens to leaderboard stats
      const leaderboard = Object.values(users)
        .filter((user) => user.role === 'citizen')
        .map((user) => ({
          id: user.id,
          fullName: user.fullName,
          username: user.username,
          avatarUrl: user.avatarUrl,
          coinBalance: user.coinBalance || 0,
          resolvedCount: resolvedCounts[user.id] || 0,
          createdAt: user.createdAt
        }))
        // Sort by resolvedCount descending, then coinBalance descending, then name alphabetically
        .sort((a, b) => {
          if (b.resolvedCount !== a.resolvedCount) {
            return b.resolvedCount - a.resolvedCount;
          }
          if (b.coinBalance !== a.coinBalance) {
            return b.coinBalance - a.coinBalance;
          }
          return a.fullName.localeCompare(b.fullName);
        })
        .slice(0, 50);

      res.json(leaderboard);
    } catch (error) {
      console.error("Error generating leaderboard:", error);
      res.status(500).json({ error: "Failed to load leaderboard" });
    }
  });

  // API Route: Post new complaint
  app.post("/api/complaints", (req, res) => {
    try {
      const { complaint, chatRoom, initialMessage, reporterEmail } = req.body;
      if (!complaint || !chatRoom || !initialMessage) {
        return res.status(400).json({ error: "Invalid complaint payload" });
      }

      const db = loadDb();
      
      // Save complaint
      db.complaints = [complaint, ...db.complaints];

      // Save chatroom
      db.chatRooms = [chatRoom, ...db.chatRooms];

      // Save message
      db.allMessages[chatRoom.id] = [initialMessage];

      // Award reporter (optional coin balance synchronization)
      if (reporterEmail) {
        const normalizedEmail = reporterEmail.trim().toLowerCase();
        if (db.users[normalizedEmail]) {
          db.users[normalizedEmail].coinBalance += 100;
        }
      }

      saveDb(db);
      console.log(`[DATABASE] Complaint added. ID: ${complaint.id}. ChatRoom: ${chatRoom.id}`);
      res.json({ success: true, complaint });
    } catch (error) {
      console.error("Error creating complaint:", error);
      res.status(500).json({ error: "Failed to create complaint" });
    }
  });

  // API Route: Update an existing complaint (verifications, resolve, challenge)
  app.put("/api/complaints/:id", (req, res) => {
    try {
      const { id } = req.params;
      const { action, verifierEmail, officerName, resolvedPhotoUrl, resolvedAt } = req.body;
      const db = loadDb();

      let updated = false;
      db.complaints = db.complaints.map(c => {
        if (c.id === id) {
          updated = true;
          if (action === "verify") {
            const userId = verifierEmail ? db.users[verifierEmail.trim().toLowerCase()]?.id || 'temp_user' : 'temp_user';
            const count = c.verificationsCount + 1;
            const userIds = [...c.verifiedUserIds, userId];
            
            // Sync user rewards on the server directly!
            if (verifierEmail) {
              const normalizedEmail = verifierEmail.trim().toLowerCase();
              if (db.users[normalizedEmail] && c.verificationsCount < 10) {
                db.users[normalizedEmail].coinBalance += 50;
              }
            }

            return { ...c, verificationsCount: count, verifiedUserIds: userIds };
          } else if (action === "resolve") {
            return {
              ...c,
              status: 'resolved' as const,
              resolvedBy: officerName || 'Officer Amit Kumar',
              resolvedAt: resolvedAt || new Date().toISOString(),
              resolvedPhotoUrl: resolvedPhotoUrl || 'https://images.unsplash.com/photo-1599740831114-171d111e40a0?auto=format&fit=crop&w=600&q=80'
            };
          } else if (action === "challenge") {
            return {
              ...c,
              status: 'pending' as const,
              verificationsCount: Math.max(0, c.verificationsCount - 2) // reset some verifications
            };
          }
        }
        return c;
      });

      if (!updated) {
        return res.status(404).json({ error: "Complaint not found" });
      }

      saveDb(db);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating complaint:", error);
      res.status(500).json({ error: "Failed to update complaint" });
    }
  });

  // API Route: Get all chat rooms
  app.get("/api/chatrooms", (req, res) => {
    try {
      const db = loadDb();
      res.json(db.chatRooms);
    } catch (error) {
      console.error("Error fetching chatrooms:", error);
      res.status(500).json({ error: "Failed to fetch chatrooms" });
    }
  });

  // API Route: Get messages for a specific chat room
  app.get("/api/messages/:chatRoomId", (req, res) => {
    try {
      const { chatRoomId } = req.params;
      const db = loadDb();
      const messages = db.allMessages[chatRoomId] || [];
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // API Route: Send message (includes automatic response from other side)
  app.post("/api/messages", (req, res) => {
    try {
      const { message, responseMsg } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message payload is required" });
      }

      const db = loadDb();
      const { chatRoomId } = message;

      if (!db.allMessages[chatRoomId]) {
        db.allMessages[chatRoomId] = [];
      }

      // Add user message
      db.allMessages[chatRoomId].push(message);

      // Update last message in chatroom
      db.chatRooms = db.chatRooms.map(room => {
        if (room.id === chatRoomId) {
          return {
            ...room,
            lastMessage: message.content,
            lastMessageAt: message.createdAt
          };
        }
        return room;
      });

      // If there is an automatic response payload, add it too!
      if (responseMsg) {
        db.allMessages[chatRoomId].push(responseMsg);
        db.chatRooms = db.chatRooms.map(room => {
          if (room.id === chatRoomId) {
            return {
              ...room,
              lastMessage: responseMsg.content,
              lastMessageAt: responseMsg.createdAt
            };
          }
          return room;
        });
      }

      saveDb(db);
      res.json({ success: true, messages: db.allMessages[chatRoomId] });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Vite middleware / client-side route handlers
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Full-Stack server is operational on http://0.0.0.0:${PORT}`);
  });
}

startServer();
