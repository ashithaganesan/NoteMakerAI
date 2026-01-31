
import React, { useState, useRef, useEffect } from 'react';
import { StudyData, AppState, TabType } from './types';
import * as Gemini from './services/gemini';
import { Flashcard } from './components/Flashcard';
import { Quiz } from './components/Quiz';
import { SummarySheet } from './components/SummarySheet';
import { AudioModule } from './components/AudioModule';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('input');
  const [inputType, setInputType] = useState<'file' | 'text'>('file');
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ name: string; data: string; mimeType: string } | null>(null);
  const [data, setData] = useState<StudyData>({});
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [loadingTab, setLoadingTab] = useState<TabType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setSelectedFile({ name: file.name, data: base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const startLearning = () => {
    if (inputType === 'file' ? !selectedFile : !content.trim()) return;
    setAppState('dashboard');
  };

  const generateModule = async (tab: TabType) => {
    // Audio is now handled internally by AudioModule for a better one-click experience
    if (tab === 'audio') return;
    if (data[tab as keyof StudyData] || loadingTab === tab) return;
    
    setLoadingTab(tab);
    setError(null);
    const input = inputType === 'file' ? selectedFile! : content;

    try {
      let result;
      switch (tab) {
        case 'summary': result = await Gemini.generateSummary(input); break;
        case 'flashcards': result = await Gemini.generateFlashcards(input); break;
        case 'quiz': result = await Gemini.generateQuiz(input); break;
      }
      setData(prev => ({ ...prev, [tab]: result }));
    } catch (err) {
      console.error(err);
      setError(`Failed to process ${tab}. Please try again.`);
    } finally {
      setLoadingTab(null);
    }
  };

  useEffect(() => {
    if (appState === 'dashboard') {
      generateModule(activeTab);
    }
  }, [appState, activeTab]);

  const sidebarItems: { id: TabType; label: string; icon: string }[] = [
    { id: 'summary', label: 'Summary', icon: '📄' },
    { id: 'flashcards', label: 'Flashcards', icon: '📇' },
    { id: 'quiz', label: 'MCQ Quiz', icon: '📝' },
    { id: 'audio', label: 'Audio Guide', icon: '🎙️' },
  ];

  const currentInput = inputType === 'file' ? selectedFile : content;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <header className="bg-white border-b border-slate-200 h-16 flex items-center px-8 shrink-0 sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-200">N</div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">NoteMaker<span className="text-indigo-600">AI</span></h1>
        </div>
        {appState === 'dashboard' && (
          <button 
            onClick={() => { setAppState('input'); setData({}); setSelectedFile(null); setContent(''); setActiveTab('summary'); }}
            className="ml-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-black rounded-xl flex items-center transition-all"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            New Session
          </button>
        )}
      </header>

      <main className="flex-grow flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden">
        {appState === 'dashboard' && (
          <aside className="w-full md:w-80 bg-white border-r border-slate-200 p-6 space-y-3 overflow-y-auto shrink-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] px-4 mb-6">Study Modules</p>
            {sidebarItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-5 py-4 rounded-2xl transition-all duration-300 group ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-100 scale-[1.02]' : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'}`}
              >
                <span className="text-2xl mr-4 group-hover:scale-125 transition-transform">{item.icon}</span>
                <span className="font-bold text-lg">{item.label}</span>
                {loadingTab === item.id && (
                  <div className="ml-auto w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {(data[item.id as keyof StudyData] || item.id === 'audio') && !loadingTab && (
                  <svg className="ml-auto w-5 h-5 text-green-400 opacity-50" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                )}
              </button>
            ))}
          </aside>
        )}

        <section className="flex-grow overflow-y-auto p-6 md:p-12 bg-slate-50/50">
          {appState === 'input' ? (
            <div className="max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="text-center mb-16">
                <span className="inline-block px-5 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6">Intelligent Learning Hub</span>
                <h2 className="text-6xl font-black text-slate-900 mb-8 tracking-tighter">Your Academic Partner</h2>
                <p className="text-2xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">Transform dense materials into interactive audio guides and quizzes instantly.</p>
              </div>
              
              <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 ring-1 ring-slate-200/50">
                <div className="flex mb-12 p-2 bg-slate-100 rounded-3xl w-fit mx-auto border border-slate-200 shadow-inner">
                  <button onClick={() => setInputType('file')} className={`px-12 py-3.5 rounded-2xl font-black transition-all ${inputType === 'file' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}>PDF File</button>
                  <button onClick={() => setInputType('text')} className={`px-12 py-3.5 rounded-2xl font-black transition-all ${inputType === 'text' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}>Text Paste</button>
                </div>
                
                {inputType === 'file' ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) processFile(f); }}
                    className={`h-96 border-4 border-dashed rounded-[3rem] flex flex-col items-center justify-center p-12 transition-all cursor-pointer group ${selectedFile ? 'border-indigo-400 bg-indigo-50/20' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-indigo-300'}`}
                  >
                    <input type="file" ref={fileInputRef} onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }} accept=".pdf" className="hidden" />
                    {selectedFile ? (
                      <div className="text-center">
                        <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white mx-auto mb-8 shadow-2xl shadow-indigo-100 animate-in zoom-in">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </div>
                        <p className="text-3xl font-black text-slate-800 tracking-tight">{selectedFile.name}</p>
                        <p className="text-indigo-600 font-black mt-3">Document selected</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="w-20 h-20 bg-slate-200 rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:bg-indigo-100 transition-all duration-300">
                          <svg className="w-10 h-10 text-slate-500 group-hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Drop your lecture PDF here</h3>
                        <p className="text-slate-400 font-bold text-lg">Or click to browse files</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <textarea 
                    value={content} 
                    onChange={e => setContent(e.target.value)} 
                    placeholder="Paste your notes here..." 
                    className="w-full h-96 p-10 bg-slate-50 border-2 border-slate-100 rounded-[3rem] outline-none focus:ring-8 focus:ring-indigo-50 transition-all text-slate-800 text-2xl font-medium leading-relaxed resize-none" 
                  />
                )}
                
                {error && <div className="mt-8 p-5 bg-red-50 text-red-600 text-lg font-black rounded-2xl border border-red-100 flex items-center shadow-sm animate-in shake"><svg className="w-6 h-6 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>{error}</div>}
                
                <button 
                  onClick={startLearning} 
                  disabled={inputType === 'file' ? !selectedFile : !content.trim()} 
                  className={`w-full py-7 rounded-[2rem] font-black text-3xl shadow-2xl transition-all transform active:scale-[0.98] mt-12 tracking-tight ${ (inputType === 'file' ? selectedFile : content.trim()) ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100 hover:-translate-y-1' : 'bg-slate-200 text-slate-400 cursor-not-allowed' }`}
                >
                  Start Learning
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
              {loadingTab === activeTab && activeTab !== 'audio' ? (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <div className="relative w-16 h-16 mb-6">
                    <div className="absolute inset-0 border-4 border-indigo-100 rounded-full" />
                    <div className="absolute inset-0 border-4 border-t-indigo-600 rounded-full animate-spin" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">Preparing Module Data</h3>
                  <p className="text-slate-400 font-bold">This will take just a moment...</p>
                </div>
              ) : (
                <>
                  {activeTab === 'summary' && data.summary && <SummarySheet items={data.summary} />}
                  
                  {activeTab === 'flashcards' && data.flashcards && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {data.flashcards.map((card, i) => <Flashcard key={i} card={card} />)}
                    </div>
                  )}
                  
                  {activeTab === 'quiz' && data.quiz && <Quiz questions={data.quiz} />}
                  
                  {activeTab === 'audio' && (
                    <AudioModule input={currentInput!} />
                  )}
                  
                  {!data[activeTab as keyof StudyData] && !loadingTab && activeTab !== 'audio' && (
                    <div className="py-20 text-center">
                      <p className="text-slate-400 font-bold">Initializing module...</p>
                    </div>
                  )}
                </>
              )}
              
              {error && activeTab !== 'audio' && (
                <div className="mt-8 p-12 bg-red-50 text-center rounded-[3rem] border border-red-100 max-w-2xl mx-auto shadow-sm">
                  <h3 className="text-2xl font-black text-red-900 mb-4">Something went wrong</h3>
                  <p className="text-red-700 text-lg mb-8">{error}</p>
                  <button onClick={() => generateModule(activeTab)} className="px-10 py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-colors shadow-lg">Try Again</button>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default App;
