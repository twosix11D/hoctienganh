
// Speech Synthesis (TTS)
import { VoiceGender, VoicePersona } from "../types";

// Global counter to track the current speech session.
// Whenever we start speaking a new phrase, we increment this.
// Any old loops checking this ID will see it has changed and stop immediately.
let currentSpeechId = 0;

export const stopSpeaking = () => {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    // Increment ID to invalidate any pending chunks waiting in setTimeout
    currentSpeechId++;
};

export const speakText = (text: string, onEnd?: () => void, voice: VoicePersona | VoiceGender = 'female_adult') => {
    if (!window.speechSynthesis) {
      console.error("Speech synthesis not supported");
      if (onEnd) onEnd();
      return;
    }
  
    // 1. Stop previous audio
    window.speechSynthesis.cancel();
    
    // 2. Start new session
    currentSpeechId++;
    const myId = currentSpeechId; // Capture the ID for this specific function call
  
    // Chunking logic to handle long texts and prevent cut-offs
    // Improved Regex to keep punctuation attached to the sentence
    const chunks = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    let index = 0;

    const speakNextChunk = () => {
        // SECURITY CHECK: If a new speech command started elsewhere, myId will be old.
        // Stop immediately.
        if (myId !== currentSpeechId) return;

        if (index >= chunks.length) {
            if (onEnd) onEnd();
            return;
        }

        const chunkText = chunks[index].trim();
        if (!chunkText) {
            index++;
            speakNextChunk();
            return;
        }

        const utterance = new SpeechSynthesisUtterance(chunkText);
        utterance.lang = 'en-US'; // Default fallback
        
        // TWEAK: Slightly slower rate sounds more "thoughtful" and less robotic
        // A rate of 0.85 is easier for learners to digest.
        utterance.rate = 0.85; 

        // Determine characteristics based on VoicePersona or VoiceGender
        const isFemale = voice.startsWith('female');
        
        let pitch = 1.0;
        if (voice.includes('child')) {
            pitch = 1.2; // Higher pitch for children
        } else if (voice.includes('elderly')) {
            pitch = 0.8; // Lower pitch for elderly
        } else {
            // Adult or generic
            // Male voices often sound better slightly deeper (0.9)
            // Female voices sound clearer slightly higher (1.05)
            pitch = isFemale ? 1.05 : 0.9; 
        }
        utterance.pitch = pitch;

        // Voice Selection Logic
        const voices = window.speechSynthesis.getVoices();
        let preferredVoice = null;

        // STRATEGY: To sound "Like a Vietnamese person speaking English" or at least less "Hollywood Robot",
        // we prioritize Asian-English locales (Singapore, Philippines, India) if available.
        // These voices often have intonation patterns more familiar to Vietnamese ears.
        const asianLocales = ['en-SG', 'en-PH', 'en-IN']; 

        if (isFemale) {
            // Priority list for Female voices
            preferredVoice = 
                // 1. Try to find "Natural" voices (Edge/Windows often has these)
                voices.find(v => v.name.includes('Natural') && v.name.includes('Female')) ||
                // 2. Try Asian English accents for familiarity
                voices.find(v => v.lang === 'en-SG' && v.name.includes('Female')) ||
                // 3. Specific good voices
                voices.find(v => v.name.includes('Samantha')) || 
                voices.find(v => v.name.includes('Google US English')) || 
                voices.find(v => v.name.includes('Zira')) ||
                // 4. Generic Fallback
                voices.find(v => v.name.includes('Female')) ||
                voices.find(v => v.lang === 'en-US');
        } else {
            // Priority list for Male voices
            preferredVoice = 
                // 1. Try to find "Natural" voices
                voices.find(v => v.name.includes('Natural') && v.name.includes('Male')) ||
                // 2. Try Asian English accents
                voices.find(v => v.lang === 'en-SG' && v.name.includes('Male')) ||
                // 3. Specific good voices
                voices.find(v => v.name.includes('Google UK English Male')) || 
                voices.find(v => v.name.includes('Daniel')) || 
                voices.find(v => v.name.includes('David')) ||
                // 4. Generic Fallback
                voices.find(v => v.name.includes('Male')) ||
                voices.find(v => v.lang === 'en-GB'); 
        }
        
        // If we found a specific Asian locale voice, ensure the utterance lang matches 
        // so the browser doesn't try to force a US accent on it.
        if (preferredVoice) {
            utterance.voice = preferredVoice;
            utterance.lang = preferredVoice.lang;
        }
      
        utterance.onend = () => {
            // SECURITY CHECK again before proceeding
            if (myId !== currentSpeechId) return;
            index++;
            speakNextChunk();
        };
      
        utterance.onerror = (e) => {
            if (myId !== currentSpeechId) return;
            
            // Ignore common interruptions
            if (e.error === 'interrupted' || e.error === 'canceled') {
                return;
            }
            console.error("TTS Error Code:", e.error);
            if (onEnd) onEnd();
        };
      
        window.speechSynthesis.speak(utterance);
    };

    // Handle voice loading delay (common in Chrome)
    if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
            if (myId !== currentSpeechId) return;
            speakNextChunk();
            window.speechSynthesis.onvoiceschanged = null;
        };
    } else {
        speakNextChunk();
    }
  };
  
  // Speech Recognition (STT)
  interface IWindow extends Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
  
  export const startListening = (
    onResult: (text: string) => void, 
    onEnd: () => void,
    onError: (err: any) => void
  ) => {
    const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
    const SpeechRecognitionAPI = SpeechRecognition || webkitSpeechRecognition;
  
    if (!SpeechRecognitionAPI) {
      onError("Speech recognition not supported in this browser.");
      onEnd();
      return null;
    }
  
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
  
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };
  
    recognition.onspeechend = () => {
      recognition.stop();
    };
  
    recognition.onend = () => {
      onEnd();
    };
  
    recognition.onerror = (event: any) => {
      // Ignore 'no-speech' if it's just a timeout, let the UI handle the retry prompt
      onError(event.error);
    };
  
    recognition.start();
    return recognition;
  };
