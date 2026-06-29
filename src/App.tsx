import React, { useState } from 'react';
import MobileSimulator from './components/MobileSimulator';
import { SystemLog, User as AppUser } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  // Simulated Device Coordinates State (for sandbox geoposition testing)
  const [deviceLocation, setDeviceLocation] = useState({
    name: 'Connaught Place Drainage (Near Issue 1)',
    lat: 28.6304,
    lng: 77.2177
  });

  const handleAddLog = (type: SystemLog['type'], message: string, details?: any) => {
    // Retained for event tracking
    console.log(`[${type.toUpperCase()}] ${message}`, details || '');
  };

  return (
    <div className="min-h-screen bg-brand-dark-bg text-brand-text-main flex items-center justify-center p-0 sm:p-4 md:p-8 font-sans select-none" id="dashboard-root">
      <div className="w-full h-screen sm:h-auto sm:max-w-sm flex justify-center animate-fade-in" id="mobile-simulator-panel">
        <MobileSimulator 
          onAddLog={handleAddLog} 
          deviceLocation={deviceLocation}
          setDeviceLocation={setDeviceLocation}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
        />
      </div>
    </div>
  );
}
