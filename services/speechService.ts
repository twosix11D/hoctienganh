
// Speech Synthesis (TTS)
import { VoiceGender } from "../types";

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

export const speakText = (text: string, onEnd?: () => void, gender: VoiceGender = 'female') => {
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
        utterance.lang = 'en-US';
        utterance.rate = 0.9; // Slightly slower for learners
        // Adjust pitch based on gender
        utterance.pitch = gender === 'female' ? 1.1 : 0.85; 

        // Voice Selection Logic
        const voices = window.speechSynthesis.getVoices();
        let preferredVoice = null;

        if (gender === 'female') {
            // Priority list for Female voices
            preferredVoice = voices.find(v => v.name.includes('Google US English')) || 
                             voices.find(v => v.name.includes('Samantha')) || 
                             voices.find(v => v.name.includes('Zira')) ||
                             voices.find(v => v.name.includes('Female')) ||
                             voices.find(v => v.lang === 'en-US');
        } else {
            // Priority list for Male voices
            preferredVoice = voices.find(v => v.name.includes('Google UK English Male')) || 
                             voices.find(v => v.name.includes('Daniel')) || 
                             voices.find(v => v.name.includes('David')) ||
                             voices.find(v => v.name.includes('Male')) ||
                             voices.find(v => v.lang === 'en-GB'); 
        }
        
        if (preferredVoice) utterance.voice = preferredVoice;
      
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
