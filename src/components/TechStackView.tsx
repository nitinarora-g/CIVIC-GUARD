import React from 'react';
import { Smartphone, Server, Layers, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function TechStackView() {
  return (
    <div className="space-y-6 text-brand-text-main animate-fade-in" id="tech-stack-container">
      {/* Overview Card */}
      <div className="bg-brand-dark-bg/60 border border-brand-border rounded-xl p-5" id="architecture-overview">
        <h3 className="font-display font-semibold text-lg text-brand-text-main flex items-center gap-2">
          <Layers className="h-5 w-5 text-brand-cyan" />
          Full-Stack Mobile Architecture
        </h3>
        <p className="mt-2 text-sm text-brand-text-dim leading-relaxed">
          To achieve live camera constraints, real-time geofenced GPS verification, and anti-spoofing challenge systems, a hybrid architecture combining high-performance native device access with a low-latency GIS (Geographic Information System) backend is recommended.
        </p>
      </div>

      {/* Flutter vs React Native Comparison */}
      <div className="border border-brand-border rounded-xl overflow-hidden" id="framework-comparison">
        <div className="bg-brand-dark-bg/80 px-4 py-3 border-b border-brand-border">
          <h4 className="font-display font-medium text-sm text-brand-text-main flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-brand-text-dim" />
            Cross-Platform Mobile Framework Recommendation
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-brand-border bg-brand-dark-card">
          {/* React Native Card */}
          <div className="p-5 space-y-3" id="rn-recommendation">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-brand-text-main text-sm">Option A: React Native (TypeScript)</span>
              <span className="bg-emerald-950/40 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-medium border border-emerald-800/30">Recommended</span>
            </div>
            <p className="text-xs text-brand-text-dim leading-relaxed">
              Best suited for dynamic UI architectures, heavy integration with Google Maps Platform, and rapid prototyping with code-sharing across web and mobile.
            </p>
            <div className="space-y-2 pt-2">
              <h5 className="text-[11px] font-semibold text-brand-text-dim uppercase tracking-wider">Key Packages (RN)</h5>
              <ul className="text-xs space-y-1 text-brand-text-main font-mono">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-brand-cyan rounded-full"></span>react-native-vision-camera</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-brand-cyan rounded-full"></span>react-native-geolocation-service</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-brand-cyan rounded-full"></span>@react-native-maps</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-brand-cyan rounded-full"></span>react-native-keychain (Secure Auth)</li>
              </ul>
            </div>
          </div>

          {/* Flutter Card */}
          <div className="p-5 space-y-3" id="flutter-recommendation">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-brand-text-main text-sm">Option B: Flutter (Dart)</span>
              <span className="bg-brand-dark-bg text-brand-text-dim text-xs px-2.5 py-0.5 rounded-full font-medium border border-brand-border">Alternative</span>
            </div>
            <p className="text-xs text-brand-text-dim leading-relaxed">
              Provides near-native performance, excellent UI rendering consistency, and direct control over pixels. Ideal for heavy camera preview shaders and custom map layers.
            </p>
            <div className="space-y-2 pt-2">
              <h5 className="text-[11px] font-semibold text-brand-text-dim uppercase tracking-wider">Key Packages (Flutter)</h5>
              <ul className="text-xs space-y-1 text-brand-text-main font-mono">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-brand-text-dim rounded-full"></span>camera (Official Plugin)</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-brand-text-dim rounded-full"></span>geolocator (GPS monitoring)</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-brand-text-dim rounded-full"></span>google_maps_flutter</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-brand-text-dim rounded-full"></span>flutter_secure_storage</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Backend & GIS Strategy */}
      <div className="border border-brand-border rounded-xl overflow-hidden bg-brand-dark-card" id="backend-architecture">
        <div className="bg-brand-dark-bg/80 px-4 py-3 border-b border-brand-border">
          <h4 className="font-display font-medium text-sm text-brand-text-main flex items-center gap-2">
            <Server className="h-4 w-4 text-brand-cyan" />
            Backend Services & GIS Infrastructure
          </h4>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-brand-border rounded-lg p-3 hover:bg-brand-dark-bg/50 transition-colors">
              <h5 className="font-semibold text-xs text-brand-text-main">1. GIS Database Extension</h5>
              <p className="mt-1 text-xs text-brand-text-dim">
                <strong>PostgreSQL + PostGIS</strong> is the industry standard. Allows high-performance queries using spatial indexing (<code className="bg-brand-dark-bg px-1 py-0.5 rounded text-brand-cyan font-mono">GIST</code>) to quickly locate duplicates or verifiers within a 150m radius.
              </p>
            </div>
            <div className="border border-brand-border rounded-lg p-3 hover:bg-brand-dark-bg/50 transition-colors">
              <h5 className="font-semibold text-xs text-brand-text-main">2. Low-Latency API Server</h5>
              <p className="mt-1 text-xs text-brand-text-dim">
                <strong>Node.js (Express) with TypeScript</strong> or <strong>Python (FastAPI)</strong>. Handles incoming geo-payloads, camera uploads directly to Secure Bucket storage, and manages real-time socket sessions.
              </p>
            </div>
            <div className="border border-brand-border rounded-lg p-3 hover:bg-brand-dark-bg/50 transition-colors">
              <h5 className="font-semibold text-xs text-brand-text-main">3. Media Storage & CDN</h5>
              <p className="mt-1 text-xs text-brand-text-dim">
                <strong>Google Cloud Storage (GCS)</strong> with Signed URLs. Tightly configured to bypass browser/gallery storage. Camera snaps direct metadata including embedded EXIF GPS tags to prevent mock-location hacks.
              </p>
            </div>
            <div className="border border-brand-border rounded-lg p-3 hover:bg-brand-dark-bg/50 transition-colors">
              <h5 className="font-semibold text-xs text-brand-text-main">4. Real-time Communication</h5>
              <p className="mt-1 text-xs text-brand-text-dim">
                <strong>WebSockets (Socket.io)</strong> to support instant messaging between citizen reporting handles and assigned district employees.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Anti-Cheat Features */}
      <div className="border border-brand-cyan/20 bg-brand-cyan-soft/10 rounded-xl p-5 space-y-3" id="anti-cheat-system">
        <h4 className="font-display font-semibold text-sm text-brand-cyan flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-brand-cyan" />
          Technical Integrity & Anti-Spoofing Mitigations
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-brand-text-main">
          <div className="flex gap-2 items-start">
            <CheckCircle2 className="h-4 w-4 text-brand-cyan shrink-0 mt-0.5" />
            <div>
              <strong>Strict Source Verification:</strong> Android <code className="font-mono bg-brand-dark-bg px-1 py-0.2 rounded">Play Integrity API</code> and iOS <code className="font-mono bg-brand-dark-bg px-1 py-0.2 rounded">DeviceCheck</code> verify that inputs come strictly from genuine, unmodified hardware with location spoofing disabled.
            </div>
          </div>
          <div className="flex gap-2 items-start">
            <CheckCircle2 className="h-4 w-4 text-brand-cyan shrink-0 mt-0.5" />
            <div>
              <strong>Metadata Corroboration:</strong> The backend cross-checks EXIF image capture times/locations against the device-submitted GPS hardware payload before confirming verification coin awards.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
