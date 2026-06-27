import React from 'react';

interface CivicsGuardLogoProps {
  className?: string;
  showText?: boolean;
}

export const CivicsGuardLogo: React.FC<CivicsGuardLogoProps> = ({ 
  className = "w-24 h-24", 
  showText = true 
}) => {
  return (
    <div className="flex flex-col items-center justify-center">
      {/* Crisp High-Quality Split Rounded-Square SVG Logo */}
      <div className={className}>
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full drop-shadow-xl"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background definitions & Clip Paths */}
          <defs>
            {/* The Old Shape (Rounded Square) used as the master clipper */}
            <clipPath id="full-card-clip">
              <rect x="60" y="60" width="280" height="280" rx="64" ry="64" />
            </clipPath>
            {/* Left Half of the Rounded Square */}
            <clipPath id="left-card-clip">
              <rect x="60" y="60" width="140" height="280" />
            </clipPath>
            {/* Right Half of the Rounded Square */}
            <clipPath id="right-card-clip">
              <rect x="200" y="60" width="140" height="280" />
            </clipPath>
          </defs>

          {/* Solid White Base for the entire Rounded Square */}
          <rect
            x="60"
            y="60"
            width="280"
            height="280"
            rx="64"
            ry="64"
            fill="white"
          />

          {/* Master Clipped Area to keep city, road, park and water within the rounded corners */}
          <g clipPath="url(#full-card-clip)">
            
            {/* LEFT HALF CONTENT (City / Blue theme) */}
            <g clipPath="url(#left-card-clip)">
              {/* Sky Background Tint */}
              <rect x="60" y="60" width="140" height="280" fill="#f8fafc" />

              {/* City Skyscrapers in Blue shades */}
              <g fill="#0ea5e9" opacity="0.95">
                <rect x="90" y="115" width="20" height="95" rx="1" />
                <rect x="115" y="90" width="24" height="120" rx="1" fill="#0284c7" />
                <rect x="142" y="110" width="18" height="100" rx="1" fill="#0369a1" />
              </g>

              {/* Little Windows on Skyscrapers */}
              <g fill="white" opacity="0.9">
                <rect x="120" y="105" width="4" height="6" />
                <rect x="128" y="105" width="4" height="6" />
                <rect x="120" y="118" width="4" height="6" />
                <rect x="128" y="118" width="4" height="6" />
                <rect x="120" y="131" width="4" height="6" />
                <rect x="128" y="131" width="4" height="6" />

                <rect x="95" y="130" width="3" height="5" />
                <rect x="102" y="130" width="3" height="5" />
                <rect x="95" y="142" width="3" height="5" />
                <rect x="102" y="142" width="3" height="5" />
              </g>

              {/* Street Lamp with Yellow Light Cone */}
              <g>
                {/* Soft yellow light cone */}
                <polygon points="95,85 150,160 100,160" fill="#fef08a" opacity="0.6" />
                {/* Lamp post structure */}
                <path
                  d="M95 185 L95 95 Q95 80 125 80 Q135 80 138 84"
                  stroke="#0f172a"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Lamp head */}
                <rect x="126" y="78" width="16" height="7" rx="2" transform="rotate(10 134 81)" fill="#0f172a" />
                <ellipse cx="132" cy="84" rx="6" ry="3" fill="#eab308" />
              </g>

              {/* Black Winding Road on Bottom-Left */}
              <path
                d="M60 180 C110 180 165 210 180 260 L60 340 Z"
                fill="#1e293b"
              />
              {/* Road Dashed Centerlines */}
              <path
                d="M70 189 C100 197 132 220 145 254"
                stroke="white"
                strokeWidth="3.5"
                strokeDasharray="6,6"
                strokeLinecap="round"
                fill="none"
              />
            </g>

            {/* RIGHT HALF CONTENT (Nature & Civic / Green theme) */}
            <g clipPath="url(#right-card-clip)">
              {/* Sky Background Tint */}
              <rect x="200" y="60" width="140" height="280" fill="#f0fdf4" />

              {/* Tree on the right side */}
              <g>
                {/* Trunk */}
                <rect x="278" y="120" width="8" height="40" rx="2" fill="#713f12" />
                {/* Leaves (Layered Green Circles) */}
                <circle cx="282" cy="115" r="28" fill="#22c55e" />
                <circle cx="264" cy="105" r="22" fill="#16a34a" />
                <circle cx="300" cy="110" r="20" fill="#15803d" />
                <circle cx="282" cy="88" r="20" fill="#4ade80" />
              </g>

              {/* Government/Civic building (Courthouse/Pavilion) */}
              <g fill="#16a34a">
                {/* Triangle Pediment */}
                <polygon points="242,152 298,152 270,138" />
                {/* Architrave (beam under triangle) */}
                <rect x="246" y="152" width="48" height="4" rx="0.5" />
                {/* 4 Pillars */}
                <rect x="250" y="158" width="5" height="24" rx="0.5" />
                <rect x="261" y="158" width="5" height="24" rx="0.5" />
                <rect x="273" y="158" width="5" height="24" rx="0.5" />
                <rect x="284" y="158" width="5" height="24" rx="0.5" />
                {/* Base/Stairs */}
                <rect x="242" y="182" width="56" height="5" rx="1" />
                <rect x="238" y="187" width="64" height="4" rx="1" />
              </g>

              {/* Park Bench */}
              <g stroke="#15803d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
                {/* Backrest & Seat */}
                <line x1="214" y1="184" x2="234" y2="184" />
                <line x1="214" y1="190" x2="234" y2="190" />
                <path d="M214 180 L214 194 L220 198 L234 198 L234 194" />
                {/* Legs */}
                <line x1="218" y1="198" x2="218" y2="204" />
                <line x1="230" y1="198" x2="230" y2="204" />
              </g>
            </g>

            {/* Bottom Water Area and Drainage Cover (Spans both left and right bottom) */}
            <path
              d="M60 240 Q130 225 200 245 Q270 225 340 240 L340 340 L60 340 Z"
              fill="#0284c7"
            />
            {/* Wave Line Overlays */}
            <path
              d="M60 252 Q130 238 200 258 Q270 238 340 252"
              stroke="#0ea5e9"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M60 268 Q130 254 200 274 Q270 254 340 268"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />

            {/* Circular Sewer Drain Cover in Water */}
            <g transform="translate(200, 285)">
              <circle cx="0" cy="0" r="24" fill="#1e293b" stroke="white" strokeWidth="4" />
              <circle cx="0" cy="0" r="18" fill="none" stroke="white" strokeWidth="1.5" />
              {/* Drain Slots / Grate Bars */}
              <line x1="-10" y1="0" x2="-10" y2="0.1" stroke="white" strokeWidth="4" strokeLinecap="round" />
              <line x1="-5" y1="-8" x2="-5" y2="8" stroke="white" strokeWidth="4.2" strokeLinecap="round" />
              <line x1="0" y1="-11" x2="0" y2="11" stroke="white" strokeWidth="4.2" strokeLinecap="round" />
              <line x1="5" y1="-8" x2="5" y2="8" stroke="white" strokeWidth="4.2" strokeLinecap="round" />
              <line x1="10" y1="0" x2="10" y2="0.1" stroke="white" strokeWidth="4" strokeLinecap="round" />
            </g>

          </g> {/* End of master clip-path group */}

          {/* DUAL-SPLIT OUTLINE BORDER (Using the exact rounded square contour) */}
          {/* We do this by applying a stroke mask or drawing curved corner line segments */}
          {/* Left Half Outer Border (Dark Blue) */}
          <path
            d="M200 60 L124 60 A64 64 0 0 0 60 124 L60 276 A64 64 0 0 0 124 340 L200 340"
            stroke="#0a1e36"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Right Half Outer Border (Green) */}
          <path
            d="M200 60 L276 60 A64 64 0 0 1 340 124 L340 276 A64 64 0 0 1 276 340 L200 340"
            stroke="#16a34a"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* CENTER CREST: Styled Person with Checkmark */}
          {/* Head of Person */}
          <circle cx="200" cy="118" r="15" fill="#0a1e36" stroke="white" strokeWidth="3" />
          
          {/* Torso Shield */}
          <path
            d="M200 138 L236 148 C236 185 220 208 200 224 C180 208 164 185 164 148 Z"
            fill="#0a1e36"
            stroke="white"
            strokeWidth="4.5"
            strokeLinejoin="round"
          />
          {/* Bold White Checkmark inside Torso Shield */}
          <path
            d="M182 178 L194 190 L220 162"
            stroke="white"
            strokeWidth="5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {showText && (
        <div className="mt-4 text-center select-none">
          {/* Main App Title */}
          <h1 className="font-sans font-extrabold tracking-tight text-3xl leading-none flex items-center justify-center gap-1.5">
            <span className="text-white">CIVIC</span>
            <span className="text-[#22c55e]">GUARD</span>
          </h1>
          {/* Subtitle Tagline */}
          <div className="mt-2.5 flex items-center justify-center gap-2 text-[8.5px] font-bold uppercase tracking-[0.14em]">
            <span className="h-[1px] w-4 bg-[#374151]"></span>
            <span className="text-white opacity-80">Report.</span>
            <span className="text-[#38bdf8]">Verify.</span>
            <span className="text-[#22c55e]">Resolve.</span>
            <span className="h-[1px] w-4 bg-[#374151]"></span>
          </div>
        </div>
      )}
    </div>
  );
};
