
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { FileData } from '../services/gemini';

interface Props {
  input: string | FileData;
}

export const AudioModule: React.FC<Props> = ({ input }) => {
  const [voice, setVoice] = useState('Kore');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef<number>(0);
  const offsetRef = useRef<number>(0);

  const voices = [
    { name: 'Kore', label: 'Classic' },
    { name: 'Puck', label: 'Warm' },
    { name: 'Charon', label: 'Deep' },
    { name: 'Zephyr', label: 'Cheerful' }
  ];

  // Stop audio when component unmounts (user exits the tab)
  useEffect(() => {
    return () => {
      if (sourceNodeRef.current) {
        try { sourceNodeRef.current.stop(); } catch (e) {}
      }
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch (e) {}
      }
    };
  }, []);

  const handleGenerateAll = async () => {
    setLoading(true);
    setStatus('Drafting educational script...');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      // Step 1: Generate the script
      const scriptPrompt = "Write a concise, engaging audio narration script summarizing this material for a student. Focus on explaining concepts clearly as if speaking to a listener.";
      const contents = typeof input === 'string' 
        ? { parts: [{ text: `${scriptPrompt}\n\nContent:\n${input}` }] }
        : { parts: [{ text: scriptPrompt }, { inlineData: { data: input.data, mimeType: input.mimeType } }] };

      const scriptResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents,
      });

      const script = scriptResponse.text;
      if (!script) throw new Error("Script generation failed");

      // Step 2: Generate Audio
      setStatus('Converting script to high-quality audio...');
      const audioResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: script }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });

      const base64Audio = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) throw new Error("Audio synthesis failed");

      // Step 3: Setup Audio Context and Play
      setStatus('Finalizing playback...');
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioCtxRef.current = ctx;

      const binary = atob(base64Audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      
      const dataInt16 = new Int16Array(bytes.buffer);
      const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
      }
      
      audioBufferRef.current = buffer;
      setDuration(buffer.duration);
      setIsGenerated(true);
      startPlayback(0);
    } catch (err) {
      console.error(err);
      alert("Something went wrong with the audio generation. Please try again in a few moments.");
    } finally {
      setLoading(false);
      setStatus('');
    }
  };

  const startPlayback = (offset: number) => {
    if (!audioCtxRef.current || !audioBufferRef.current) return;

    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch (e) {}
    }

    const source = audioCtxRef.current.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.playbackRate.value = playbackRate;
    source.connect(audioCtxRef.current.destination);
    
    source.onended = () => {
      if (!audioCtxRef.current) return;
      const currentPos = offsetRef.current + (audioCtxRef.current.currentTime - startTimeRef.current) * playbackRate;
      if (currentPos >= audioBufferRef.current!.duration - 0.2) {
        setIsPlaying(false);
        offsetRef.current = 0;
      }
    };

    source.start(0, offset);
    sourceNodeRef.current = source;
    startTimeRef.current = audioCtxRef.current.currentTime;
    offsetRef.current = offset;
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (isPlaying) {
      if (sourceNodeRef.current) {
        try { sourceNodeRef.current.stop(); } catch (e) {}
      }
      if (audioCtxRef.current) {
        offsetRef.current += (audioCtxRef.current.currentTime - startTimeRef.current) * playbackRate;
      }
      setIsPlaying(false);
    } else {
      if (audioBufferRef.current) {
        startPlayback(offsetRef.current);
      }
    }
  };

  const seek = (seconds: number) => {
    if (!audioBufferRef.current || !audioCtxRef.current) return;
    
    let currentPos = offsetRef.current;
    if (isPlaying) {
      currentPos += (audioCtxRef.current.currentTime - startTimeRef.current) * playbackRate;
    }
    
    const newOffset = Math.max(0, Math.min(duration, currentPos + seconds));
    startPlayback(newOffset);
  };

  useEffect(() => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.playbackRate.value = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    let interval: number;
    if (isPlaying) {
      interval = window.setInterval(() => {
        if (audioCtxRef.current && audioBufferRef.current) {
          const current = offsetRef.current + (audioCtxRef.current.currentTime - startTimeRef.current) * playbackRate;
          setCurrentTime(Math.min(current, duration));
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackRate, duration]);

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-3xl mx-auto animate-in fade-in zoom-in-95">
      <div className="flex flex-col items-center mb-10 text-center">
        <div className={`w-28 h-28 rounded-[2rem] flex items-center justify-center shadow-2xl transition-all duration-500 mb-6 relative overflow-hidden ${isGenerated ? 'bg-indigo-600 shadow-indigo-100' : 'bg-slate-100 shadow-slate-50'}`}>
          {isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center space-x-1.5 opacity-40">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="w-1.5 bg-white rounded-full animate-bounce" style={{ height: `${Math.random() * 60 + 20}%`, animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          )}
          <svg className={`w-12 h-12 transition-colors ${isGenerated ? 'text-white' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Audio Guide</h2>
        <p className="text-slate-500 font-bold text-lg mt-2">Personal AI Audio Narrator</p>
      </div>

      {!isGenerated ? (
        <div className="p-16 border-4 border-dashed border-slate-100 rounded-[3rem] bg-slate-50 flex flex-col items-center text-center">
          {loading ? (
            <div className="flex flex-col items-center space-y-8">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 border-4 border-indigo-100 rounded-full" />
                <div className="absolute inset-0 border-4 border-t-indigo-600 rounded-full animate-spin" />
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-black text-indigo-900 animate-pulse">{status}</p>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">AI is working on your guide</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <p className="text-slate-600 text-xl font-medium max-w-md mx-auto leading-relaxed">
                Transform your material into a professional audio narration. Click below to begin the AI synthesis.
              </p>
              
              <div className="flex flex-col items-center space-y-6">
                <div className="flex flex-wrap justify-center gap-3">
                    {voices.map(v => (
                    <button 
                        key={v.name} 
                        onClick={() => setVoice(v.name)}
                        className={`px-6 py-3 rounded-2xl text-base font-black transition-all ${voice === v.name ? 'bg-indigo-600 text-white shadow-xl scale-110' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'}`}
                    >
                        {v.label} Voice
                    </button>
                    ))}
                </div>

                <button
                    onClick={handleGenerateAll}
                    className="group relative px-16 py-6 bg-indigo-600 text-white font-black text-2xl rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(79,70,229,0.5)] hover:bg-indigo-700 hover:scale-[1.03] active:scale-95 transition-all flex items-center mx-auto mt-4 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    <svg className="w-8 h-8 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Start Audio Synthesis
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          <div className="mb-10 px-4">
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-4 shadow-inner">
              <div 
                className="h-full bg-indigo-600 transition-all duration-100 ease-linear shadow-[0_0_15px_rgba(79,70,229,0.6)]" 
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} 
              />
            </div>
            <div className="flex justify-between text-sm font-black text-slate-400 uppercase tracking-[0.2em]">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-12 mb-14">
            <button 
              onClick={() => seek(-10)} 
              className="p-5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-[1.5rem] transition-all transform active:scale-90"
              title="Rewind 10s"
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
              </svg>
            </button>
            
            <button 
              onClick={togglePlay} 
              className="w-28 h-28 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-[0_25px_50px_-12px_rgba(79,70,229,0.4)] hover:bg-indigo-700 hover:scale-110 active:scale-95 transition-all"
            >
              {isPlaying ? (
                <svg className="w-14 h-14" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
              ) : (
                <svg className="w-14 h-14 ml-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>

            <button 
              onClick={() => seek(10)} 
              className="p-5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-[1.5rem] transition-all transform active:scale-90"
              title="Forward 10s"
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.934 12.8a1 1 0 000-1.6l-5.334-4A1 1 0 005 8v8a1 1 0 001.6.8l5.334-4zm7.934 0a1 1 0 000-1.6l-5.334-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.334-4z" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-12 border-t border-slate-100">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-5">Voice Selection</label>
              <div className="flex flex-wrap gap-2">
                {voices.map(v => (
                  <button 
                    key={v.name} 
                    onClick={() => { setVoice(v.name); setIsGenerated(false); }}
                    className={`px-5 py-3 rounded-xl text-sm font-black transition-all ${voice === v.name ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-5">Speed Control</label>
              <div className="flex flex-wrap gap-2">
                {[0.5, 1.0, 1.25, 1.5, 2.0].map(s => (
                  <button 
                    key={s} 
                    onClick={() => setPlaybackRate(s)}
                    className={`px-5 py-3 rounded-xl text-sm font-black transition-all ${playbackRate === s ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};