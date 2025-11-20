import React from 'react';
import { UserProfile, Unit, AppView } from '../types';

interface HomeViewProps {
  user: UserProfile;
  units: Unit[];
  onStartLesson: (unit: Unit) => void;
  onNavigate: (view: AppView) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ user, units, onStartLesson, onNavigate }) => {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Top Bar */}
      <header className="flex justify-between items-center p-4 border-b border-gray-200 bg-white sticky top-0 z-20">
        <div className="flex items-center space-x-4">
            {/* Flag */}
             <div className="text-2xl">🇺🇸</div>
        </div>
        <div className="flex items-center space-x-4 text-sm font-bold">
          <div className="flex items-center text-yellow-500">
            <i className="fas fa-fire mr-1"></i> {user.streak}
          </div>
          <div className="flex items-center text-blue-400">
            <i className="fas fa-gem mr-1"></i> {user.gems}
          </div>
          <div className="flex items-center text-red-500">
            <i className="fas fa-heart mr-1"></i> {user.hearts}
          </div>
        </div>
      </header>

      {/* Path Content */}
      <main className="flex-1 overflow-y-auto p-6 pb-24 custom-scrollbar relative">
        <div className="flex flex-col items-center space-y-6 py-8">
          {units.map((unit, index) => (
            <UnitNode 
              key={unit.id} 
              unit={unit} 
              index={index} 
              onStart={() => onStartLesson(unit)}
            />
          ))}
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="flex justify-around items-center p-4 border-t border-gray-200 bg-white fixed bottom-0 w-full max-w-md z-30">
        <NavButton icon="fa-home" active onClick={() => onNavigate('home')} />
        <NavButton icon="fa-dumbbell" onClick={() => {}} />
        <NavButton icon="fa-chart-bar" onClick={() => {}} />
        <NavButton icon="fa-user" onClick={() => onNavigate('profile')} />
      </nav>
    </div>
  );
};

const UnitNode: React.FC<{ unit: Unit; index: number; onStart: () => void }> = ({ unit, index, onStart }) => {
  // Calculate offset for zig-zag path
  const offset = index % 2 === 0 ? 'translate-x-0' : (index % 4 === 1 ? 'translate-x-8' : '-translate-x-8');
  
  return (
    <div className={`flex flex-col items-center transition-transform ${offset}`}>
      {/* Button and Label Container */}
      <div className="flex flex-col items-center">
        <button
          onClick={!unit.isLocked ? onStart : undefined}
          className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-lg border-b-4 active:border-b-0 active:translate-y-1 transition-all relative z-10
            ${unit.isLocked 
              ? 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed' 
              : `${unit.color} text-white ${unit.color.replace('bg-', 'border-').replace('500', '700')}`
            }
          `}
        >
          <i className={`fas ${unit.icon}`}></i>
        </button>
        
        {/* Label - Static position to prevent overlap */}
        {!unit.isLocked && (
            <div className="mt-2 bg-white border border-gray-200 px-3 py-1 rounded-xl shadow-sm text-xs font-bold text-gray-600 whitespace-nowrap z-0">
                {unit.title}
            </div>
        )}
      </div>
    </div>
  );
};

const NavButton: React.FC<{ icon: string; active?: boolean; onClick: () => void }> = ({ icon, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`text-2xl transition-colors ${active ? 'text-green-500' : 'text-gray-400 hover:text-gray-600'}`}
  >
    <i className={`fas ${icon}`}></i>
  </button>
);
