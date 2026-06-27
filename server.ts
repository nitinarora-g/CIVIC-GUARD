import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

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
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80',
    latitude: 28.6304,
    longitude: 77.2177,
    address: 'Radial Road 3, Connaught Place, New Delhi - 110001',
    state: 'Delhi NCR',
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
    imageUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=600&q=80',
    latitude: 28.6129,
    longitude: 77.2295,
    address: 'Kartavya Path Near Gate 2, Central Secretariat, New Delhi - 110001',
    state: 'Delhi NCR',
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
    imageUrl: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80',
    latitude: 28.6254,
    longitude: 77.2345,
    address: 'Mandi House Circle Lane, New Delhi - 110001',
    state: 'Delhi NCR',
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
    imageUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=600&q=80',
    latitude: 28.6441,
    longitude: 77.1895,
    address: 'Padam Singh Road Crossroad, Karol Bagh, New Delhi - 110005',
    state: 'Delhi NCR',
    district: 'Central Delhi',
    status: 'resolved',
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
    state: 'Delhi NCR',
    district: 'New Delhi',
    coinBalance: 0,
    createdAt: '2026-04-01T09:00:00Z',
    username: 'officer_amit',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80'
  }
};

function loadDb(): DbSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Failed to load database.json, re-seeding...", err);
  }
  
  const defaultDb: DbSchema = {
    users: initialUsersSeed,
    complaints: initialComplaintsSeed,
    chatRooms: initialChatRoomsSeed,
    allMessages: initialMessagesSeed
  };
  saveDb(defaultDb);
  return defaultDb;
}

function saveDb(db: DbSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save database.json:", err);
  }
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
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON request bodies
  app.use(express.json());

  // API Route: Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API Route: Send OTP
  app.post("/api/send-otp", async (req, res) => {
    try {
      const { emailOrPhone, role } = req.body;
      if (!emailOrPhone) {
        return res.status(400).json({ error: "Email or Phone number is required" });
      }

      const normalizedInput = emailOrPhone.trim().toLowerCase();
      
      if (role === "officer") {
        if (!normalizedInput.includes("@") || !normalizedInput.endsWith("gov.in")) {
          return res.status(400).json({ error: "Government employees must log in with an official email ending with gov.in" });
        }
      }
      
      // Generate a secure 4-digit OTP
      const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

      // Store in memory
      otpStorage.set(normalizedInput, { otp: generatedOtp, expiresAt });

      console.log(`[AUTH] OTP '${generatedOtp}' generated for '${normalizedInput}' (${role})`);

      const isEmail = normalizedInput.includes("@");

      if (isEmail) {
        // Option 1: Send via Resend (if key is configured)
        if (process.env.RESEND_API_KEY) {
          try {
            console.log("Sending OTP via Resend...");
            const resend = new Resend(process.env.RESEND_API_KEY);
            const { data, error } = await resend.emails.send({
              from: "CivicGuard Gateway <onboarding@resend.dev>",
              to: [normalizedInput],
              subject: "CivicGuard Unified Gateway - Verification Code",
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px; background-color: #ffffff;">
                  <h2 style="color: #0f172a; border-bottom: 2px solid #06b6d4; padding-bottom: 10px;">CivicGuard Unified Gateway</h2>
                  <p style="font-size: 14px; color: #334155;">Hello,</p>
                  <p style="font-size: 14px; color: #334155;">You requested a secure verification code to access your <strong>${role === "officer" ? "Government Authority Desk" : "Citizen Account"}</strong>.</p>
                  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0;">
                    <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0891b2;">${generatedOtp}</span>
                  </div>
                  <p style="font-size: 12px; color: #64748b; margin-top: 30px;">This code is confidential and will expire in 5 minutes. If you did not request this, please ignore this email.</p>
                </div>
              `
            });
            if (error) {
              console.error("Resend error:", error);
              throw error;
            }
            return res.json({ 
              success: true, 
              message: "OTP sent successfully to your email address.",
              isSimulated: false 
            });
          } catch (err: any) {
            console.warn("Resend failed, falling back to SMTP/Ethereal", err.message);
          }
        }

        // Option 2: Send via custom SMTP (if configured)
        if (process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_HOST) {
          try {
            console.log("Sending OTP via custom SMTP...");
            const transporter = nodemailer.createTransport({
              host: process.env.SMTP_HOST,
              port: parseInt(process.env.SMTP_PORT || "587"),
              secure: process.env.SMTP_PORT === "465",
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              },
            });

            await transporter.sendMail({
              from: `"CivicGuard Gateway" <${process.env.SMTP_USER}>`,
              to: normalizedInput,
              subject: "CivicGuard Verification Code",
              text: `Your verification code is: ${generatedOtp}. Valid for 5 minutes.`,
              html: `<strong>Your verification code is: <span style="font-size: 24px; color: #0891b2;">${generatedOtp}</span></strong>. Valid for 5 minutes.`,
            });

            return res.json({ 
              success: true, 
              message: "OTP sent successfully via custom SMTP server.",
              isSimulated: false 
            });
          } catch (err: any) {
            console.warn("SMTP send failed, falling back to Ethereal", err.message);
          }
        }

        // Option 3: Fallback Sandbox Sandbox Mode (Nodemailer Ethereal SMTP)
        // This is extremely helpful because it provides a REAL email address and inbox URL!
        try {
          console.log("Sending OTP via Ethereal test mailer...");
          const transporter = await getEtherealTransporter();
          const info = await transporter.sendMail({
            from: '"CivicGuard Sandboxed Gateway" <gateway@civicguard.gov>',
            to: normalizedInput,
            subject: "CivicGuard Unified Gateway - Verification OTP Code",
            html: `
              <div style="font-family: sans-serif; padding: 20px; background-color: #0f172a; color: #f1f5f9; border-radius: 12px;">
                <h2 style="color: #22d3ee; margin-top: 0;">CivicGuard Verification Token</h2>
                <p>Hello tester! A login attempt was detected for <strong>${normalizedInput}</strong> (${role}).</p>
                <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0;">
                  <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #22d3ee;">${generatedOtp}</span>
                </div>
                <p style="font-size: 11px; color: #94a3b8;">This email was sent via a dynamic Ethereal testing SMTP relay inside the sandbox environment.</p>
              </div>
            `
          });

          const testMailUrl = nodemailer.getTestMessageUrl(info);
          console.log(`[TEST MAIL] Message sent: ${info.messageId}`);
          console.log(`[TEST MAIL] View inbox at: ${testMailUrl}`);

          return res.json({
            success: true,
            message: "OTP dispatched to Ethereal sandboxed mailbox.",
            testMailUrl: testMailUrl || undefined,
            simulatedOtp: generatedOtp,
            isSimulated: true,
            method: "ethereal"
          });
        } catch (err: any) {
          console.error("Ethereal mailer failure:", err);
          return res.status(500).json({ error: "Failed to dispatch email verification. Server issue." });
        }
      } else {
        // SMS Processing
        // Option 1: Send via Twilio (if credentials provided)
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER) {
          try {
            console.log("Sending OTP SMS via Twilio...");
            const authHeader = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
            
            const response = await fetch(
              `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                  Authorization: `Basic ${authHeader}`
                },
                body: new URLSearchParams({
                  To: normalizedInput,
                  From: process.env.TWILIO_FROM_NUMBER,
                  Body: `CivicGuard Gatekeeper: Your verification code is ${generatedOtp}. This OTP is valid for 5 minutes.`
                }).toString()
              }
            );

            const data = await response.json();
            if (!response.ok) {
              throw new Error(data.message || "Twilio request failed");
            }

            console.log(`Twilio SMS sent successfully. SID: ${data.sid}`);
            return res.json({ 
              success: true, 
              message: "SMS OTP sent successfully to your device.",
              isSimulated: false 
            });
          } catch (err: any) {
            console.warn("Twilio SMS failed, falling back to simulated SMS", err.message);
          }
        }

        // Option 2: Fallback simulated SMS
        return res.json({
          success: true,
          message: "SMS OTP simulated successfully.",
          simulatedOtp: generatedOtp,
          isSimulated: true,
          method: "simulator"
        });
      }

    } catch (error: any) {
      console.error("Error in send-otp API:", error);
      res.status(500).json({ error: "Internal server error while processing verification code" });
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
      const email = "nitinarora5969@gmail.com";
      const normalizedInput = email.toLowerCase().trim();
      let user = getUser(normalizedInput);

      if (!user) {
        user = {
          id: "usr_g_nitin",
          emailOrPhone: normalizedInput,
          fullName: "Nitin Arora",
          role: "citizen",
          coinBalance: 200,
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
      res.json(db.complaints);
    } catch (error) {
      console.error("Error fetching complaints:", error);
      res.status(500).json({ error: "Failed to fetch complaints" });
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
