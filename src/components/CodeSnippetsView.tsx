import React, { useState } from 'react';
import { FileCode, Sparkles, Check, Copy } from 'lucide-react';

export default function CodeSnippetsView() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const geofenceSnippet = `/**
 * Core Geofencing & Smart Duplicate Detection Controller
 * Checks for similar active complaints within a 150-meter geofenced radius.
 * Written in Node.js / Express with TypeScript + PostGIS or raw SQL.
 */
import { Request, Response } from 'express';
import { pool } from '../db'; // Postgres pool instance

export async function checkAndCreateComplaint(req: Request, res: Response) {
  const { reporterId, title, description, imageUrl, category, latitude, longitude, address, state, district } = req.body;

  try {
    // GEOFENCE DISTANCE CONSTRAINT (150 meters)
    const GEOFENCE_LIMIT_METERS = 150;

    // QUERY: Identify if any pending complaints of the SAME TYPE/CATEGORY 
    // are located within our physical 150-meter geofence.
    // ST_DistanceSphere returns the distance between two geometries in meters using spherical calculations.
    const duplicateQuery = \`
      SELECT id, title, address, ST_DistanceSphere(
        geom, 
        ST_SetSRID(ST_Point($1, $2), 4326)
      ) as distance_meters
      FROM complaints
      WHERE status = 'pending'
        AND category = $3
        AND ST_DistanceSphere(geom, ST_SetSRID(ST_Point($1, $2), 4326)) <= $4
      ORDER BY distance_meters ASC
      LIMIT 1;
    \`;

    const duplicates = await pool.query(duplicateQuery, [
      longitude, 
      latitude, 
      category, 
      GEOFENCE_LIMIT_METERS
    ]);

    if (duplicates.rows.length > 0) {
      const existing = duplicates.rows[0];
      return res.status(409).json({
        error: "DUPLICATE_COMPLAINT_DETECTED",
        message: \`An active '\${category}' complaint already exists within 150 meters of this location.\`,
        existingIssue: {
          id: existing.id,
          title: existing.title,
          address: existing.address,
          distanceMeters: Math.round(existing.distance_meters)
        }
      });
    }

    // EXCEPTION GRANTED: No duplicate of same category found. Insert the new complaint.
    const insertQuery = \`
      INSERT INTO complaints (
        reporter_id, title, description, image_url, category, 
        latitude, longitude, geom, address, state, district, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, ST_SetSRID(ST_Point($7, $6), 4326), $8, $9, $10, 'pending')
      RETURNING *;
    \`;

    const newComplaint = await pool.query(insertQuery, [
      reporterId, title, description, imageUrl, category,
      latitude, longitude, address, state, district
    ]);

    // Reward initial reporter 100 coins
    await pool.query(
      "UPDATE users SET coin_balance = coin_balance + 100 WHERE id = $1",
      [reporterId]
    );

    // Log the coin ledger transaction
    await pool.query(
      "INSERT INTO coin_transactions (user_id, amount, type, complaint_id, description) VALUES ($1, 100, 'earn_report', $2, 'Reporter rewards for submitting genuine complaint')",
      [reporterId, newComplaint.rows[0].id]
    );

    return res.status(201).json({
      success: true,
      message: "Complaint registered successfully. 100 Coins credited.",
      complaint: newComplaint.rows[0]
    });

  } catch (error) {
    console.error("Error creating complaint:", error);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
}`;

  const verifySnippet = `/**
 * Crowdsourced GPS Verification & Coin Rewards Controller
 * Validates selfie & location proximity (<= 150m) before granting verifier coins.
 */
import { Request, Response } from 'express';
import { pool } from '../db';

export async function verifyComplaintLocation(req: Request, res: Response) {
  const { verifierId, complaintId, verifierLatitude, verifierLongitude, selfieUrl } = req.body;

  try {
    const PROXIMITY_LIMIT_METERS = 150;
    const REVIEWER_LIMIT_CAP = 10;

    // 1. Fetch complaint and compute distance from the verifier's live GPS coordinates
    const complaintQuery = \`
      SELECT id, status, verifications_count, latitude, longitude,
             ST_DistanceSphere(geom, ST_SetSRID(ST_Point($1, $2), 4326)) as distance_meters
      FROM complaints
      WHERE id = $3;
    \`;

    const complaintResult = await pool.query(complaintQuery, [
      verifierLongitude,
      verifierLatitude,
      complaintId
    ]);

    if (complaintResult.rows.length === 0) {
      return res.status(404).json({ error: "COMPLAINT_NOT_FOUND" });
    }

    const complaint = complaintResult.rows[0];

    // Ensure complaint is still active (pending)
    if (complaint.status !== 'pending') {
      return res.status(400).json({ error: "INVALID_STATUS", message: "Verification only permitted on pending issues." });
    }

    // 2. Proximity GPS Check: Must be within 150 meters
    const distanceMeters = complaint.distance_meters;
    const isWithinGeofence = distanceMeters <= PROXIMITY_LIMIT_METERS;

    if (!isWithinGeofence) {
      return res.status(403).json({
        error: "PROXIMITY_CHECK_FAILED",
        message: \`You are physically too far away to audit this issue. Currently: \${Math.round(distanceMeters)}m away. Proximity limit is \${PROXIMITY_LIMIT_METERS}m.\`
      });
    }

    // 3. Double-Verification Guard: Verify user hasn't already reviewed this issue
    const duplicateLog = await pool.query(
      "SELECT id FROM verification_logs WHERE complaint_id = $1 AND verifier_id = $2",
      [complaintId, verifierId]
    );

    if (duplicateLog.rows.length > 0) {
      return res.status(400).json({ error: "ALREADY_VERIFIED", message: "You have already completed verification for this complaint." });
    }

    // 4. Log validation entry
    await pool.query(\`
      INSERT INTO verification_logs (complaint_id, verifier_id, verifier_latitude, verifier_longitude, selfie_url, is_within_geofence, type)
      VALUES ($1, $2, $3, $4, $5, true, 'verify')
    \`, [complaintId, verifierId, verifierLatitude, verifierLongitude, selfieUrl]);

    // 5. Check if verifications count is under the reward cap of 10
    let rewarded = false;
    if (complaint.verifications_count < REVIEWER_LIMIT_CAP) {
      rewarded = true;
      // Increment coin balance by 50 for the verifier
      await pool.query(
        "UPDATE users SET coin_balance = coin_balance + 50 WHERE id = $1",
        [verifierId]
      );
      // Log coin ledger
      await pool.query(
        "INSERT INTO coin_transactions (user_id, amount, type, complaint_id, description) VALUES ($1, 50, 'earn_verify', $2, 'Verifier rewards for validating complaint location')",
        [verifierId, complaintId]
      );
    }

    // Increment complaint verifications_count
    await pool.query(
      "UPDATE complaints SET verifications_count = verifications_count + 1 WHERE id = $1",
      [complaintId]
    );

    return res.status(200).json({
      success: true,
      message: rewarded 
        ? "Verification successful! GPS matched. 50 Coins credited." 
        : "Verification successful! Verified after cap limit reached (No coins rewarded).",
      distanceMeters: Math.round(distanceMeters),
      rewarded
    });

  } catch (error) {
    console.error("Error verifying complaint:", error);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
}`;

  return (
    <div className="space-y-6 animate-fade-in" id="code-snippets-container">
      {/* Smart Geofencing Card */}
      <div className="border border-brand-border rounded-xl bg-brand-dark-card overflow-hidden shadow-sm">
        <div className="bg-brand-dark-bg/80 border-b border-brand-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-cyan" />
            <span className="font-display font-medium text-xs text-brand-text-main">1. Smart Duplication Detection Algorithm (PostGIS)</span>
          </div>
          <button
            onClick={() => copyToClipboard(geofenceSnippet, 'geofence')}
            className="p-1 rounded-lg border border-brand-border hover:bg-brand-dark-bg transition-colors text-brand-text-dim bg-brand-dark-card"
            title="Copy Code"
          >
            {copiedId === 'geofence' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
        <div className="p-4 bg-brand-dark-bg/55 text-brand-text-main text-xs font-mono overflow-x-auto max-h-[300px] no-scrollbar">
          <pre>{geofenceSnippet}</pre>
        </div>
      </div>

      {/* GPS matching verify Card */}
      <div className="border border-brand-border rounded-xl bg-brand-dark-card overflow-hidden shadow-sm">
        <div className="bg-brand-dark-bg/80 border-b border-brand-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-cyan" />
            <span className="font-display font-medium text-xs text-brand-text-main">2. Crowdsourced GPS Verification Engine (Radius constraint)</span>
          </div>
          <button
            onClick={() => copyToClipboard(verifySnippet, 'verify')}
            className="p-1 rounded-lg border border-brand-border hover:bg-brand-dark-bg transition-colors text-brand-text-dim bg-brand-dark-card"
            title="Copy Code"
          >
            {copiedId === 'verify' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
        <div className="p-4 bg-brand-dark-bg/55 text-brand-text-main text-xs font-mono overflow-x-auto max-h-[300px] no-scrollbar">
          <pre>{verifySnippet}</pre>
        </div>
      </div>
    </div>
  );
}
