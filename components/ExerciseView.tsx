
import React, { useState } from 'react';
import { ExerciseLevel, ExerciseResponse, ExerciseEvaluation } from '../types';
import { generateExercise, evaluateExercise } from '../services/geminiService';

interface ExerciseViewProps {
    onNavigate: (view: any) => void;
}

const LEVELS: ExerciseLevel[] = [
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
    'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9',
    'Grade 10', 'Grade 11', 'Grade 12',
    'TOEIC', 'University'
];

const SUGGESTED_TOPICS = ['Animals', 'Food', 'Travel', 'School', 'Work', 'Environment', 'Technology', 'Family'];

export const ExerciseView: React.FC<ExerciseViewProps> = ({ onNavigate }) => {
    // Config State
    const [selectedLevel, setSelectedLevel] = useState<ExerciseLevel>('Grade 6');
    const [topic, setTopic] = useState('Animals');
    
    // Exercise State
    const [loading, setLoading] = useState(false);
    const [currentExercise, setCurrentExercise] = useState<ExerciseResponse | null>(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [evaluation, setEvaluation] = useState<ExerciseEvaluation | null>(null);
    const [checking, setChecking] = useState(false);

    const handleGenerate = async () => {
        if (!topic.trim()) return;
        setLoading(true);
        setCurrentExercise(null);
        setEvaluation(null);
        setUserAnswer('');
        
        try {
            const data = await generateExercise(selectedLevel, topic);
            setCurrentExercise(data);
        } catch (e) {
            alert("Failed to generate exercise. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleCheck = async () => {
        if (!currentExercise || !userAnswer.trim()) return;
        setChecking(true);
        try {
            const result = await evaluateExercise(
                currentExercise.exercise.question,
                userAnswer,
                currentExercise.exercise.answer_key
            );
            setEvaluation(result);
        } catch (e) {
            console.error(e);
        } finally {
            setChecking(false);
        }
    };

    const handleOptionClick = (opt: string) => {
        setUserAnswer(opt);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 relative">
             {/* Header */}
            <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center space-x-2">
                    <i className="fas fa-dumbbell text-blue-500 text-xl"></i>
                    <h1 className="text-lg font-bold text-gray-700">Practice Arena</h1>
                </div>
                {/* Stats placeholder or close */}
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-24">
                {/* Configuration Section */}
                {!currentExercise && !loading && (
                    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6 animate-pop">
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-gray-800">Create Exercise</h2>
                            <p className="text-gray-500 text-sm">Generate unique questions instantly</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-2">Level</label>
                            <select 
                                value={selectedLevel} 
                                onChange={(e) => setSelectedLevel(e.target.value as ExerciseLevel)}
                                className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
                            >
                                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-2">Topic</label>
                            <input 
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
                                placeholder="e.g. Business, Sports..."
                            />
                            <div className="flex flex-wrap gap-2 mt-2">
                                {SUGGESTED_TOPICS.slice(0, 4).map(t => (
                                    <button key={t} onClick={() => setTopic(t)} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs text-gray-600">
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={handleGenerate}
                            className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95"
                        >
                            Generate Exercise
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        <p className="text-gray-500 font-medium animate-pulse">Generating unique question...</p>
                    </div>
                )}

                {/* Exercise Display */}
                {currentExercise && (
                    <div className="max-w-md mx-auto space-y-6 animate-pop">
                        {/* Header Card */}
                        <div className="flex justify-between items-center px-2">
                             <span className="px-3 py-1 bg-blue-100 text-blue-600 text-xs font-bold rounded-full uppercase">{currentExercise.exercise.difficulty}</span>
                             <span className="px-3 py-1 bg-purple-100 text-purple-600 text-xs font-bold rounded-full uppercase">{currentExercise.exercise.type}</span>
                        </div>

                        {/* Question Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-sm text-gray-400 font-bold uppercase mb-2">Instruction</h3>
                            <p className="text-gray-700 mb-4 font-medium">{currentExercise.exercise.instruction}</p>
                            
                            <h3 className="text-sm text-gray-400 font-bold uppercase mb-2">Question</h3>
                            <p className="text-xl text-gray-800 font-bold leading-relaxed whitespace-pre-line">
                                {currentExercise.exercise.question}
                            </p>
                            {currentExercise.exercise.example && (
                                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-500 italic">
                                    Ex: {currentExercise.exercise.example}
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        {!evaluation ? (
                            <div className="space-y-4">
                                {currentExercise.exercise.options && currentExercise.exercise.options.length > 0 ? (
                                    <div className="grid gap-3">
                                        {currentExercise.exercise.options.map((opt, idx) => (
                                            <button 
                                                key={idx}
                                                onClick={() => handleOptionClick(opt)}
                                                className={`p-4 rounded-xl border-2 text-left transition-all font-medium
                                                    ${userAnswer === opt 
                                                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                                                    }`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <textarea 
                                        value={userAnswer}
                                        onChange={(e) => setUserAnswer(e.target.value)}
                                        placeholder="Type your answer here..."
                                        className="w-full p-4 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500 min-h-[120px]"
                                    />
                                )}

                                <button 
                                    onClick={handleCheck}
                                    disabled={!userAnswer || checking}
                                    className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all
                                        ${!userAnswer || checking ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 active:scale-95'}
                                    `}
                                >
                                    {checking ? "Checking..." : "Check Answer"}
                                </button>
                            </div>
                        ) : (
                            // Evaluation Result
                            <div className={`rounded-2xl p-6 border-2 ${evaluation.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} animate-pop`}>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xl
                                        ${evaluation.isCorrect ? 'bg-green-500' : 'bg-red-500'}
                                    `}>
                                        <i className={`fas ${evaluation.isCorrect ? 'fa-check' : 'fa-times'}`}></i>
                                    </div>
                                    <h2 className={`text-xl font-bold ${evaluation.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                                        {evaluation.isCorrect ? 'Correct!' : 'Incorrect'}
                                    </h2>
                                </div>
                                
                                <p className="text-gray-700 mb-4 leading-relaxed">
                                    {evaluation.explanation}
                                </p>
                                
                                {!evaluation.isCorrect && (
                                    <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                                        <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Correct Answer</span>
                                        <span className="text-gray-800 font-medium">{currentExercise.exercise.answer_key}</span>
                                    </div>
                                )}

                                <button 
                                    onClick={() => {
                                        setCurrentExercise(null);
                                        setEvaluation(null);
                                        setUserAnswer('');
                                    }}
                                    className={`w-full py-3 rounded-xl font-bold text-white shadow-md transition-colors
                                        ${evaluation.isCorrect ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}
                                    `}
                                >
                                    Next Question
                                </button>
                            </div>
                        )}
                        
                        {/* Cancel/Back Button */}
                        {!evaluation && (
                             <button onClick={() => setCurrentExercise(null)} className="w-full py-3 text-gray-400 font-bold hover:text-gray-600">
                                Cancel
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom Nav - Reused styles */}
            <nav className="flex justify-around items-center p-4 border-t border-gray-200 bg-white sticky bottom-0 w-full z-30">
                <button onClick={() => onNavigate('home')} className="text-2xl text-gray-400 hover:text-gray-600"><i className="fas fa-home"></i></button>
                <button className="text-2xl text-blue-500"><i className="fas fa-dumbbell"></i></button>
                <button className="text-2xl text-gray-400 hover:text-gray-600"><i className="fas fa-chart-bar"></i></button>
                <button onClick={() => onNavigate('profile')} className="text-2xl text-gray-400 hover:text-gray-600"><i className="fas fa-user"></i></button>
            </nav>
        </div>
    );
};
