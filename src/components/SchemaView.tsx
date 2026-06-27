import React, { useState } from 'react';
import { Database, Key, Link2, CircleDot, Eye, EyeOff } from 'lucide-react';

interface Column {
  name: string;
  type: string;
  key?: 'PK' | 'FK' | 'GIS';
  references?: string;
  description: string;
}

interface TableDef {
  name: string;
  description: string;
  columns: Column[];
}

export default function SchemaView() {
  const [selectedTable, setSelectedTable] = useState<string | null>('users');
  const [showSQL, setShowSQL] = useState<boolean>(false);

  const schemas: TableDef[] = [
    {
      name: 'users',
      description: 'Stores unified credentials and balances for both Citizens and Government employees.',
      columns: [
        { name: 'id', type: 'VARCHAR(50)', key: 'PK', description: 'Unique UUID key identifier.' },
        { name: 'email_or_phone', type: 'VARCHAR(100) UNIQUE', description: 'Validated registration handle.' },
        { name: 'full_name', type: 'VARCHAR(100)', description: 'Display name of user.' },
        { name: 'role', type: 'VARCHAR(20)', description: "Role toggle: 'citizen' or 'officer'." },
        { name: 'state', type: 'VARCHAR(50)', description: 'Assigned state (NULL for citizens, required for employees).' },
        { name: 'district', type: 'VARCHAR(50)', description: 'Assigned district (NULL for citizens, required for employees).' },
        { name: 'coin_balance', type: 'INTEGER', description: 'Tracks user coins (Defaults to 0, reporter gets 100, reviewer 50).' },
        { name: 'created_at', type: 'TIMESTAMP', description: 'Timestamp of profile creation.' }
      ]
    },
    {
      name: 'complaints',
      description: 'Primary registry for citizen-reported physical civic infrastructure failures.',
      columns: [
        { name: 'id', type: 'VARCHAR(50)', key: 'PK', description: 'Unique complaint ID.' },
        { name: 'reporter_id', type: 'VARCHAR(50)', key: 'FK', references: 'users(id)', description: 'Citizen who logged the original report.' },
        { name: 'title', type: 'VARCHAR(150)', description: 'Concise summary of physical failure.' },
        { name: 'description', type: 'TEXT', description: 'Detailed user commentary.' },
        { name: 'image_url', type: 'VARCHAR(500)', description: 'Live-camera capture URL stored in cloud storage (no uploads).' },
        { name: 'geom', type: 'GEOMETRY(Point, 4326)', key: 'GIS', description: 'PostGIS spatial index containing precise coordinates.' },
        { name: 'latitude', type: 'DECIMAL(9,6)', description: 'Raw GPS latitude coordinate.' },
        { name: 'longitude', type: 'DECIMAL(9,6)', description: 'Raw GPS longitude coordinate.' },
        { name: 'address', type: 'VARCHAR(300)', description: 'Complete physical street location.' },
        { name: 'state', type: 'VARCHAR(50)', description: 'State boundaries used for dynamic query routing.' },
        { name: 'district', type: 'VARCHAR(50)', description: 'District boundaries used for dynamic query routing.' },
        { name: 'status', type: 'VARCHAR(20)', description: "Lifecycle flag: 'pending' or 'resolved'." },
        { name: 'verifications_count', type: 'INTEGER', description: 'Capped at 10 verifications maximum.' },
        { name: 'resolved_by', type: 'VARCHAR(50)', key: 'FK', references: 'users(id)', description: 'Assigned Officer who fixed the issue.' },
        { name: 'resolved_photo_url', type: 'VARCHAR(500)', description: 'Before/After verification proof image taken live.' },
        { name: 'resolved_at', type: 'TIMESTAMP', description: 'Timestamp of status resolution.' },
        { name: 'created_at', type: 'TIMESTAMP', description: 'Incident submission timestamp.' }
      ]
    },
    {
      name: 'verification_logs',
      description: 'Audit records of crowdsourced citizen reviews validating or challenging complaints.',
      columns: [
        { name: 'id', type: 'VARCHAR(50)', key: 'PK', description: 'Verification instance ID.' },
        { name: 'complaint_id', type: 'VARCHAR(50)', key: 'FK', references: 'complaints(id)', description: 'Target issue being audited.' },
        { name: 'verifier_id', type: 'VARCHAR(50)', key: 'FK', references: 'users(id)', description: 'Citizen review author.' },
        { name: 'verifier_latitude', type: 'DECIMAL(9,6)', description: 'Live verification GPS latitude.' },
        { name: 'verifier_longitude', type: 'DECIMAL(9,6)', description: 'Live verification GPS longitude.' },
        { name: 'selfie_url', type: 'VARCHAR(500)', description: 'Live selfie of verifier taken physically on site.' },
        { name: 'is_within_geofence', type: 'BOOLEAN', description: 'Confirms live verification GPS matches target complaint (<= 150m).' },
        { name: 'type', type: 'VARCHAR(20)', description: "Action type: 'verify' or 'challenge'." },
        { name: 'created_at', type: 'TIMESTAMP', description: 'Submission audit time.' }
      ]
    },
    {
      name: 'coin_transactions',
      description: 'Durable ledger tracking all virtual coin allocations and anti-abuse penalties.',
      columns: [
        { name: 'id', type: 'VARCHAR(50)', key: 'PK', description: 'Ledger log reference.' },
        { name: 'user_id', type: 'VARCHAR(50)', key: 'FK', references: 'users(id)', description: 'Recipient or debtor account.' },
        { name: 'amount', type: 'INTEGER', description: 'Positive/negative virtual coin count.' },
        { name: 'type', type: 'VARCHAR(30)', description: "'earn_report' (+100), 'earn_verify' (+50), or 'challenge_penalty'." },
        { name: 'complaint_id', type: 'VARCHAR(50)', key: 'FK', references: 'complaints(id)', description: 'Linked physical issue context.' },
        { name: 'description', type: 'VARCHAR(250)', description: 'Human-readable ledger remark.' },
        { name: 'created_at', type: 'TIMESTAMP', description: 'Ledger block timestamp.' }
      ]
    },
    {
      name: 'chat_rooms',
      description: 'Communication hubs bound to pending reports to support resolution updates.',
      columns: [
        { name: 'id', type: 'VARCHAR(50)', key: 'PK', description: 'Chat channel ID.' },
        { name: 'complaint_id', type: 'VARCHAR(50)', key: 'FK', references: 'complaints(id)', description: 'Associated physical issue.' },
        { name: 'citizen_id', type: 'VARCHAR(50)', key: 'FK', references: 'users(id)', description: 'Citizen handle.' },
        { name: 'last_message', type: 'VARCHAR(300)', description: 'Latest dialogue snip.' },
        { name: 'last_message_at', type: 'TIMESTAMP', description: 'Latest active response interval.' }
      ]
    },
    {
      name: 'messages',
      description: 'Direct thread entries containing dialogues exchanged within a chat channel.',
      columns: [
        { name: 'id', type: 'VARCHAR(50)', key: 'PK', description: 'Unique message identifier.' },
        { name: 'chat_room_id', type: 'VARCHAR(50)', key: 'FK', references: 'chat_rooms(id)', description: 'Parent chat channel.' },
        { name: 'sender_id', type: 'VARCHAR(50)', key: 'FK', references: 'users(id)', description: 'UUID of the speaker.' },
        { name: 'sender_role', type: 'VARCHAR(20)', description: "Sender category for display styling ('citizen' | 'officer')." },
        { name: 'content', type: 'TEXT', description: 'Text message body payload.' },
        { name: 'created_at', type: 'TIMESTAMP', description: 'Message sent timestamp.' }
      ]
    }
  ];

  // SQL schema rendering generator
  const getSQLString = () => {
    return `-- Civic Transparency System Schema (PostgreSQL + PostGIS Extension)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Users table
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  email_or_phone VARCHAR(100) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) CHECK (role IN ('citizen', 'officer')) NOT NULL,
  state VARCHAR(50),
  district VARCHAR(50),
  coin_balance INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Complaints table
CREATE TABLE complaints (
  id VARCHAR(50) PRIMARY KEY,
  reporter_id VARCHAR(50) REFERENCES users(id) NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  image_url VARCHAR(500) NOT NULL,
  latitude DECIMAL(9,6) NOT NULL,
  longitude DECIMAL(9,6) NOT NULL,
  geom GEOMETRY(Point, 4326),
  address VARCHAR(300) NOT NULL,
  state VARCHAR(50) NOT NULL,
  district VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')) NOT NULL,
  verifications_count INTEGER DEFAULT 0 NOT NULL,
  resolved_by VARCHAR(50) REFERENCES users(id),
  resolved_photo_url VARCHAR(500),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Spatial Index on geom
CREATE INDEX complaints_spatial_idx ON complaints USING GIST (geom);

-- Trigger to keep PostGIS geometry synced with lat/lng coordinates
CREATE OR REPLACE FUNCTION update_complaint_geom()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geom := ST_SetSRID(ST_Point(NEW.longitude, NEW.latitude), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_complaint_geom
BEFORE INSERT OR UPDATE ON complaints
FOR EACH ROW EXECUTE FUNCTION update_complaint_geom();
`;
  };

  return (
    <div className="space-y-6 animate-fade-in" id="schema-viewer-root">
      {/* Schema Controls */}
      <div className="flex justify-between items-center bg-[#141414]/85 border border-brand-border rounded-xl p-4">
        <div>
          <h3 className="font-display font-semibold text-sm text-brand-text-main flex items-center gap-2">
            <Database className="h-4 w-4 text-brand-cyan" />
            PostgreSQL Relational DB Design
          </h3>
          <p className="text-xs text-brand-text-dim">Includes PostGIS extensions and spatial indices</p>
        </div>
        <button
          onClick={() => setShowSQL(!showSQL)}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-brand-border rounded-lg text-xs font-medium hover:bg-brand-dark-bg text-brand-text-main bg-brand-dark-card transition-colors"
        >
          {showSQL ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {showSQL ? 'Show ER Diagram' : 'Show Postgres SQL'}
        </button>
      </div>

      {showSQL ? (
        <div className="relative border border-brand-border rounded-xl overflow-hidden bg-brand-dark-bg text-brand-text-main p-4 font-mono text-xs max-h-[480px] overflow-y-auto">
          <pre>{getSQLString()}</pre>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="er-diagram-grid">
          {/* Tables Selection List */}
          <div className="space-y-2 border-r border-brand-border pr-2">
            <h4 className="text-[10px] font-bold text-brand-text-dim uppercase tracking-widest pl-1">Tables (6)</h4>
            {schemas.map((table) => (
              <button
                key={table.name}
                onClick={() => setSelectedTable(table.name)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-all flex items-center justify-between ${
                  selectedTable === table.name
                    ? 'bg-brand-cyan-soft border border-brand-cyan/30 text-brand-cyan font-semibold shadow-sm'
                    : 'border border-transparent text-brand-text-dim hover:bg-brand-dark-bg/50 hover:text-brand-text-main'
                }`}
              >
                <span>{table.name}</span>
                {table.name === 'complaints' && <span className="bg-brand-cyan-soft text-brand-cyan text-[9px] px-1.5 py-0.2 rounded font-sans uppercase">GIS</span>}
              </button>
            ))}
          </div>

          {/* Table Details Node */}
          <div className="md:col-span-2 space-y-4" id="table-details-node">
            {schemas.map((table) => {
              if (table.name !== selectedTable) return null;
              return (
                <div key={table.name} className="border border-brand-border rounded-xl bg-brand-dark-card shadow-sm overflow-hidden animate-fade-in">
                  <div className="bg-brand-dark-bg/80 border-b border-brand-border px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="font-mono text-sm font-semibold text-brand-text-main uppercase">{table.name}</span>
                    </div>
                    <span className="text-brand-text-dim font-mono text-[10px]">Relation Node</span>
                  </div>
                  <div className="px-4 py-2 border-b border-brand-border bg-brand-dark-bg/30">
                    <p className="text-xs text-brand-text-dim leading-relaxed italic">
                      {table.description}
                    </p>
                  </div>
                  <div className="divide-y divide-brand-border max-h-[350px] overflow-y-auto no-scrollbar">
                    {table.columns.map((col) => (
                      <div key={col.name} className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-start justify-between gap-1 hover:bg-brand-dark-bg/40 transition-colors">
                        <div className="flex items-center gap-2">
                          {col.key === 'PK' && (
                            <span className="bg-yellow-950/40 text-yellow-400 border border-yellow-800/20 text-[8px] font-bold px-1 py-0.2 rounded flex items-center gap-0.5" title="Primary Key">
                              <Key className="h-2.5 w-2.5" /> PK
                            </span>
                          )}
                          {col.key === 'FK' && (
                            <span className="bg-brand-cyan-soft text-brand-cyan border border-brand-cyan/20 text-[8px] font-bold px-1 py-0.2 rounded flex items-center gap-0.5" title={`Foreign Key referencing ${col.references}`}>
                              <Link2 className="h-2.5 w-2.5" /> FK
                            </span>
                          )}
                          {col.key === 'GIS' && (
                            <span className="bg-purple-950/40 text-purple-400 border border-purple-800/20 text-[8px] font-bold px-1 py-0.2 rounded flex items-center gap-0.5" title="Spatial Index Geometry">
                              <CircleDot className="h-2.5 w-2.5" /> GIS
                            </span>
                          )}
                          <span className="font-mono text-xs font-semibold text-brand-text-main">{col.name}</span>
                        </div>
                        <div className="sm:text-right space-y-1">
                          <span className="font-mono text-[11px] font-medium text-brand-cyan bg-brand-cyan-soft px-1.5 py-0.2 rounded">{col.type}</span>
                          <p className="text-xs text-brand-text-dim sm:max-w-xs">{col.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
