
// Speech Synthesis (TTS)
import { VoiceGender } from "../types";

// Helper to ensure clean cancellation
export const stopSpeaking = () => {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
};

export const speakText = (text: string, onEnd?: () => void, gender: VoiceGender = 'female') => {
    if (!window.speechSynthesis) {
      console.error("Speech synthesis not supported");
      if (onEnd) onEnd();
      return;
    }
  
    // Cancel any current speaking
    window.speechSynthesis.cancel();
  
    // Chunking logic to handle long texts and prevent cut-offs
    const chunks = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    let index = 0;

    const speakNextChunk = () => {
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
        utterance.pitch = gender === 'female' ? 1.1 : 0.9; // Adjust pitch slightly based on gender

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
                             voices.find(v => v.lang === 'en-GB'); // GB often has good male voices if US is missing
        }
        
        if (preferredVoice) utterance.voice = preferredVoice;
      
        utterance.onend = () => {
            index++;
            speakNextChunk();
        };
      
        utterance.onerror = (e) => {
            if (e.error === 'interrupted' || e.error === 'canceled') {
                return;
            }
            console.error("TTS Error Code:", e.error);
            if (onEnd) onEnd();
        };
      
        window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
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
      onError(event.error);
    };
  
    recognition.start();
    return recognition;
  };
