
import React, { useState, useEffect } from 'react';
import { HomeView } from './components/HomeView';
import { LessonView } from './components/LessonView';
import { ProfileView } from './components/ProfileView';
import { ExerciseView } from './components/ExerciseView'; // Import new view
import { UserProfile, AppView, Unit, VoicePersona } from './types';
import { INITIAL_UNITS } from './constants';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [activeUnit, setActiveUnit] = useState<Unit | null>(null);
  
  // Global User State
  const [user, setUser] = useState<UserProfile>({
    name: 'Learner',
    level: 'Intermediate',
    xp: 1250,
    streak: 5,
    hearts: 5,
    maxHearts: 5,
    gems: 450,
    voiceGender: 'female', // Default
    voicePersona: 'female_adult', // Default Persona
    isMuted: false // Default Unmuted
  });

  const handleStartLesson = (unit: Unit) => {
    setActiveUnit(unit);
    setCurrentView('lesson');
  };

  const handleLessonComplete = (xpGained: number, heartsRemaining: number) => {
    setUser(prev => ({
      ...prev,
      xp: prev.xp + xpGained,
      hearts: heartsRemaining,
      streak: prev.streak
    }));
    setCurrentView('home');
    setActiveUnit(null);
  };

  const handleExitLesson = () => {
    setCurrentView('home');
    setActiveUnit(null);
  };

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
  };

  const handleUpdateName = (newName: string) => {
    setUser(prev => ({ ...prev, name: newName }));
  };

  const handleUpdatePersona = (persona: VoicePersona) => {
    setUser(prev => ({ ...prev, voicePersona: persona }));
  };

  const handleToggleMute = () => {
      setUser(prev => ({ ...prev, isMuted: !prev.isMuted }));
  };

  // Regenerate hearts over time (mock)
  useEffect(() => {
    if (user.hearts < user.maxHearts) {
      const timer = setTimeout(() => {
        setUser(prev => ({ ...prev, hearts: Math.min(prev.hearts + 1, prev.maxHearts) }));
      }, 30000); // 30 seconds for demo purposes
      return () => clearTimeout(timer);
    }
  }, [user.hearts, user.maxHearts]);

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full sm:max-w-lg md:max-w-xl bg-white h-[100dvh] shadow-xl flex flex-col relative overflow-hidden">
        {currentView === 'home' && (
          <HomeView 
            user={user} 
            units={INITIAL_UNITS} 
            onStartLesson={handleStartLesson}
            onNavigate={handleNavigate}
          />
        )}
        {currentView === 'lesson' && activeUnit && (
          <LessonView 
            user={user}
            unit={activeUnit}
            onComplete={handleLessonComplete}
            onExit={handleExitLesson}
            updateHearts={(newHearts) => setUser(prev => ({ ...prev, hearts: newHearts }))}
            onUpdatePersona={handleUpdatePersona}
            onToggleMute={handleToggleMute}
          />
        )}
        {currentView === 'profile' && (
          <ProfileView 
            user={user}
            onUpdateName={handleUpdateName}
            onNavigate={handleNavigate}
          />
        )}
        {currentView === 'exercise' && (
            <ExerciseView onNavigate={handleNavigate} />
        )}
      </div>
    </div>
  );
};

export default App;
