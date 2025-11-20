
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Unit, LessonResponse, SavedLessonState, ChatEntry, VoiceGender } from '../types';
import { startLessonSession, submitUserAudioText, getChatHistory, resumeLessonSession } from '../services/geminiService';
import { speakText, startListening } from '../services/speechService';

interface LessonViewProps {
  user: UserProfile;
  unit: Unit;
  onComplete: (xp: number, hearts: number) => void;
  onExit: () => void;
  updateHearts: (n: number) => void;
  onUpdateVoice: (gender: VoiceGender) => void;
}

export const LessonView: React.FC<LessonViewProps> = ({ user, unit, onComplete, onExit, updateHearts, onUpdateVoice }) => {
  const [loading, setLoading] = useState(true);
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Chat State
  const [chatEntries, setChatEntries] = useState<ChatEntry[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const [progress, setProgress] = useState(0);
  const [currentXP, setCurrentXP] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  // Resume Dialog State
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [savedState, setSavedState] = useState<SavedLessonState | null>(null);

  const hasInitialized = useRef(false);

  // Auto-scroll to bottom when chat changes
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chatEntries, processing, listening]);

  // 1. Check for saved state on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const storageKey = `lingo_save_${unit.id}`;
    const savedJson = localStorage.getItem(storageKey);

    if (savedJson) {
        try {
            const parsedState: SavedLessonState = JSON.parse(savedJson);
            setSavedState(parsedState);
            setShowResumeDialog(true);
            setLoading(false);
        } catch (e) {
            console.error("Failed to parse saved state", e);
            startNewLesson();
        }
    } else {
        startNewLesson();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unit.id]);

  // --- Lesson Management ---

  const startNewLesson = async () => {
      setLoading(true);
      setShowResumeDialog(false);
      localStorage.removeItem(`lingo_save_${unit.id}`);
      
      try {
        const topic = unit.topics[0] || unit.description;
        const data = await startLessonSession(user, topic);
        
        const initialEntry: ChatEntry = {
            id: Date.now().toString(),
            role: 'model',
            text: data.next_question, // Initial question
            audioScript: data.voice_script
        };

        setChatEntries([initialEntry]);
        setLoading(false);
        
        saveProgress([initialEntry], 0, 0, user.hearts);

        if(data.voice_script) {
            setTimeout(() => speakText(data.voice_script, undefined, user.voiceGender), 500);
        }
      } catch (e) {
        console.error(e);
        setErrorMessage("Failed to load lesson. Check connection/API Key.");
        setLoading(false);
      }
  };

  const resumeLesson = async () => {
      if (!savedState) return;
      setLoading(true);
      setShowResumeDialog(false);

      try {
          await resumeLessonSession(savedState.history);
          setChatEntries(savedState.chatEntries);
          setProgress(savedState.progress);
          setCurrentXP(savedState.currentXP);
          updateHearts(savedState.hearts);
          setLoading(false);
      } catch (e) {
          console.error("Failed to resume", e);
          startNewLesson();
      }
  };

  const saveProgress = async (entries: ChatEntry[], prog: number, xp: number, hearts: number) => {
      try {
          const history = await getChatHistory();
          const state: SavedLessonState = {
              unitId: unit.id,
              history: history,
              chatEntries: entries,
              progress: prog,
              currentXP: xp,
              hearts: hearts
          };
          localStorage.setItem(`lingo_save_${unit.id}`, JSON.stringify(state));
      } catch (e) {
          console.error("Failed to save progress", e);
      }
  };

  // --- Interaction Logic ---

  const handleMicrophoneClick = () => {
    if (listening || processing) return;

    setListening(true);
    setErrorMessage('');

    startListening(
      (text) => {
         // Waiting for onEnd
      },
      () => {
        setListening(false);
      },
      (err) => {
        console.warn("Mic Error:", err);
        setListening(false);
        if (err === 'no-speech') {
             setErrorMessage("Didn't catch that. Tap to try again.");
        } else {
             setErrorMessage("Microphone error. Please try again.");
        }
      }
    );

    const { webkitSpeechRecognition, SpeechRecognition } = window as any;
    const SpeechAPI = SpeechRecognition || webkitSpeechRecognition;
    if (!SpeechAPI) return;
    
    const recognition = new SpeechAPI();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        submitAnswer(transcript);
    };
    recognition.onerror = (e: any) => {
        setListening(false);
        if(e.error === 'no-speech') setErrorMessage("Didn't catch that.");
    };
    recognition.onspeechend = () => setListening(false);
    recognition.start();
  };

  const submitAnswer = async (transcript: string) => {
    if (!transcript.trim()) return;
    
    setProcessing(true);
    setErrorMessage('');

    const userEntry: ChatEntry = {
        id: Date.now().toString(),
        role: 'user',
        text: transcript
    };
    
    const updatedEntries = [...chatEntries, userEntry];
    setChatEntries(updatedEntries);

    try {
      const response = await submitUserAudioText(transcript);
      
      const combinedText = `${response.reply} ${response.next_question}`;
      
      const modelEntry: ChatEntry = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: combinedText,
          correction: response.correction,
          audioScript: response.voice_script
      };

      const finalEntries = [...updatedEntries, modelEntry];
      setChatEntries(finalEntries);

      const newXP = currentXP + 10;
      const newProgress = Math.min(progress + 10, 100);
      
      setCurrentXP(newXP);
      setProgress(newProgress);
      
      saveProgress(finalEntries, newProgress, newXP, user.hearts);

      if (response.voice_script) {
          speakText(response.voice_script, undefined, user.voiceGender);
      }

    } catch (e) {
      console.error(e);
      setErrorMessage("Connection error.");
    } finally {
      setProcessing(false);
    }
  };

  const changeVoice = (gender: VoiceGender) => {
      onUpdateVoice(gender);
      setShowSettings(false);
      // Test the voice immediately
      speakText(`Okay, I will use this ${gender} voice from now on.`, undefined, gender);
  };

  // --- RENDER ---

  if (loading && !showResumeDialog) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (showResumeDialog) {
      return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 flex flex-col items-center animate-pop">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 text-2xl mb-4">
                    <i className="fas fa-history"></i>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Welcome Back</h2>
                <p className="text-gray-500 text-center mb-6">Continue your conversation?</p>
                <div className="w-full space-y-3">
                    <button onClick={resumeLesson} className="w-full py-3 bg-blue-500 text-white font-bold rounded-xl shadow-lg">Continue</button>
                    <button onClick={startNewLesson} className="w-full py-3 bg-gray-100 text-gray-500 font-bold rounded-xl">Restart</button>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 relative">
      {/* Header */}
      <div className="flex-none flex items-center p-4 bg-white shadow-sm z-10">
        <button onClick={onExit} className="text-gray-400 hover:text-gray-600">
          <i className="fas fa-times text-xl"></i>
        </button>
        <div className="flex-1 mx-4 text-center font-bold text-gray-700">
            {unit.title}
        </div>
        <div className="w-8"></div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
          <div className="absolute inset-0 z-40 flex items-end sm:items-center justify-center bg-black/20 backdrop-blur-sm p-4" onClick={() => setShowSettings(false)}>
              <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 animate-pop" onClick={e => e.stopPropagation()}>
                  <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Voice Settings</h3>
                  <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => changeVoice('female')}
                        className={`p-4 rounded-xl flex flex-col items-center space-y-2 border-2 transition-all ${user.voiceGender === 'female' ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-gray-100 bg-gray-50 text-gray-400'}`}
                      >
                          <i className="fas fa-female text-2xl"></i>
                          <span className="font-bold">Female</span>
                      </button>
                      <button 
                        onClick={() => changeVoice('male')}
                        className={`p-4 rounded-xl flex flex-col items-center space-y-2 border-2 transition-all ${user.voiceGender === 'male' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-100 bg-gray-50 text-gray-400'}`}
                      >
                          <i className="fas fa-male text-2xl"></i>
                          <span className="font-bold">Male</span>
                      </button>
                  </div>
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="w-full mt-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl"
                  >
                      Close
                  </button>
              </div>
          </div>
      )}

      {/* Chat Area */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar"
      >
        {chatEntries.map((entry) => (
            <div key={entry.id} className={`flex w-full ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[85%] ${entry.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    
                    {/* Avatar */}
                    <div className={`flex-none w-10 h-10 rounded-full flex items-center justify-center text-sm shadow-sm mt-auto mb-1 overflow-hidden border border-gray-100 bg-gray-100
                        ${entry.role === 'user' ? 'ml-2' : 'mr-2'}`}>
                        <img 
                            src={entry.role === 'user' 
                                ? "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExaThoMTN4b3M2eG9ndGhlemQ2aDU5MThhNm5qNzM5ZmR3M3FuZDd4ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/1ynDNZYeUwPkQBhx99/giphy.gif" // Capoo in box
                                : "https://media0.giphy.com/media/v1.Y2lkPWVjZjA1ZTQ3djhqcHlpb2FxZXkyNGhoYnExeHBqeTRvZDl4bDFtN3pxbGl5dWEzdyZlcD12MV9zdGlja2Vyc19yZWxhdGVkJmN0PXM/uBn5A3rxwD7N8nZvlw/200.webp" // AI Capoo
                            }
                            alt={entry.role}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${entry.role === 'user' ? 'Me' : 'AI'}&background=random&color=fff&size=128`;
                            }}
                        />
                    </div>

                    {/* Bubble */}
                    <div className={`flex flex-col p-3 rounded-2xl shadow-sm text-sm leading-relaxed relative group
                        ${entry.role === 'user' 
                            ? 'bg-green-500 text-white rounded-br-none' 
                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                        }`}>
                        
                        {/* Text */}
                        <span>{entry.text}</span>

                        {/* Audio Replay Button */}
                        {entry.role === 'model' && entry.audioScript && (
                            <button 
                                onClick={() => speakText(entry.audioScript!, undefined, user.voiceGender)}
                                className="absolute -right-8 top-2 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                            >
                                <i className="fas fa-volume-up text-xs"></i>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        ))}

        {processing && (
            <div className="flex justify-start w-full">
                <div className="flex items-center space-x-2 bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-none ml-12 shadow-sm">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
            </div>
        )}
        <div className="h-4"></div>
      </div>

      {/* Footer Input Area */}
      <div className="flex-none bg-white p-4 border-t border-gray-100">
        {errorMessage && (
            <div className="text-center text-red-500 text-xs font-bold mb-2 animate-pulse">
                {errorMessage}
            </div>
        )}
        
        <div className="flex items-center justify-center space-x-6">
             <button className="w-10 h-10 rounded-full text-gray-300 hover:bg-gray-100 flex items-center justify-center transition-colors">
                 <i className="fas fa-keyboard"></i>
             </button>

             <button 
                onClick={handleMicrophoneClick}
                disabled={processing || listening}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-lg transition-all transform
                    ${listening 
                        ? 'bg-red-500 text-white scale-110 ring-4 ring-red-200' 
                        : 'bg-green-500 text-white hover:bg-green-600 active:scale-95'
                    }
                    ${processing ? 'bg-gray-300 cursor-not-allowed' : ''}
                `}
             >
                <i className={`fas ${listening ? 'fa-stop' : 'fa-microphone'}`}></i>
             </button>

             <button 
                onClick={() => setShowSettings(true)}
                className="w-10 h-10 rounded-full text-gray-400 hover:bg-gray-100 hover:text-blue-500 flex items-center justify-center transition-colors"
             >
                 <i className="fas fa-cog"></i>
             </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-3 font-medium">
            {listening ? "Listening..." : processing ? "Thinking..." : "Tap to speak"}
        </p>
      </div>
    </div>
  );
};
