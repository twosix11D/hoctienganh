import React, { useState } from 'react';
import { UserProfile } from '../types';

interface ProfileViewProps {
  user: UserProfile;
  onUpdateName: (newName: string) => void;
  onNavigate: (view: 'home' | 'profile') => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdateName, onNavigate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(user.name);

  const handleSave = () => {
    if (tempName.trim()) {
      onUpdateName(tempName.trim());
      setIsEditing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center sticky top-0 z-10">
         <h1 className="text-xl font-bold text-gray-700">Profile</h1>
         <button onClick={() => onNavigate('home')} className="text-gray-400">
            <i className="fas fa-times text-xl"></i>
         </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {/* User Info Card */}
        <div className="flex flex-col items-center bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-blue-50 border-4 border-white shadow-md mb-4 overflow-hidden relative">
                <img 
                    src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExaThoMTN4b3M2eG9ndGhlemQ2aDU5MThhNm5qNzM5ZmR3M3FuZDd4ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/1ynDNZYeUwPkQBhx99/giphy.gif"
                    alt="User Avatar"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                />
            </div>

            {/* Name Edit Section */}
            <div className="flex items-center justify-center w-full mb-2">
                {isEditing ? (
                    <div className="flex items-center space-x-2 w-full max-w-[200px]">
                        <input 
                            type="text" 
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            className="w-full px-3 py-1 border-b-2 border-blue-500 focus:outline-none text-center text-xl font-bold text-gray-800 bg-transparent"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        />
                        <button 
                            onClick={handleSave}
                            className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center shadow-sm hover:bg-green-600"
                        >
                            <i className="fas fa-check"></i>
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center space-x-2">
                        <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="text-gray-400 hover:text-blue-500 p-1"
                        >
                            <i className="fas fa-pencil-alt"></i>
                        </button>
                    </div>
                )}
            </div>
            
            <p className="text-gray-500 text-sm font-medium">{user.level} Learner</p>
            <p className="text-gray-400 text-xs mt-1">Joined 2024</p>
        </div>

        {/* Stats Grid */}
        <h3 className="text-lg font-bold text-gray-700 mb-4">Statistics</h3>
        <div className="grid grid-cols-2 gap-4 mb-6">
            <StatBox icon="fa-fire" color="text-orange-500" value={user.streak.toString()} label="Day Streak" />
            <StatBox icon="fa-bolt" color="text-yellow-500" value={user.xp.toString()} label="Total XP" />
            <StatBox icon="fa-gem" color="text-blue-500" value={user.gems.toString()} label="Gems" />
            <StatBox icon="fa-crown" color="text-yellow-600" value="0" label="Top 3 Finishes" />
        </div>
      </div>

      {/* Bottom Nav (Matches HomeView structure for consistency) */}
      <nav className="flex justify-around items-center p-4 border-t border-gray-200 bg-white sticky bottom-0 w-full z-30">
        <button onClick={() => onNavigate('home')} className="text-2xl text-gray-400"><i className="fas fa-home"></i></button>
        <button className="text-2xl text-gray-400"><i className="fas fa-dumbbell"></i></button>
        <button className="text-2xl text-gray-400"><i className="fas fa-chart-bar"></i></button>
        <button className="text-2xl text-green-500"><i className="fas fa-user"></i></button>
      </nav>
    </div>
  );
};

const StatBox: React.FC<{ icon: string; color: string; value: string; label: string }> = ({ icon, color, value, label }) => (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center space-x-3 shadow-sm">
        <i className={`fas ${icon} ${color} text-xl w-6`}></i>
        <div>
            <div className="font-bold text-gray-800 text-lg">{value}</div>
            <div className="text-xs text-gray-400 uppercase font-bold">{label}</div>
        </div>
    </div>
);
