import { Game, Question } from '../types';
import { db } from '../firebase';
import { doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';
import { Play, RotateCcw, ChevronRight, Trophy, Link as LinkIcon, Users, Settings, Plus, Trash2, X, Save, Monitor, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { INITIAL_QUESTIONS } from '../constants';
import { useState } from 'react';

interface Props {
  game: Game;
}

const GAME_ID = 'main-class-game';

export default function HostView({ game }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editQuestions, setEditQuestions] = useState<Question[]>(game.questions);

  const startGame = async () => {
    const gameRef = doc(db, 'games', GAME_ID);
    const firstQuestion = game.questions[0];
    await updateDoc(gameRef, {
      status: 'playing',
      currentQuestionIndex: 0,
      redTeam: { score: 0, currentProgress: Array(firstQuestion.answer.length).fill('_'), solved: false },
      blueTeam: { score: 0, currentProgress: Array(firstQuestion.answer.length).fill('_'), solved: false },
      updatedAt: new Date().toISOString()
    });
  };

  const nextQuestion = async () => {
    const nextIndex = game.currentQuestionIndex + 1;
    if (nextIndex >= game.questions.length) {
      await updateDoc(doc(db, 'games', GAME_ID), { 
        status: 'finished',
        winner: game.redTeam.score > game.blueTeam.score ? 'red' : (game.blueTeam.score > game.redTeam.score ? 'blue' : 'draw')
      });
      return;
    }

    const nextQ = game.questions[nextIndex];
    await updateDoc(doc(db, 'games', GAME_ID), {
      currentQuestionIndex: nextIndex,
      redTeam: { ...game.redTeam, currentProgress: Array(nextQ.answer.length).fill('_'), solved: false },
      blueTeam: { ...game.blueTeam, currentProgress: Array(nextQ.answer.length).fill('_'), solved: false },
      updatedAt: new Date().toISOString()
    });
  };

  const resetGame = async () => {
    const gameRef = doc(db, 'games', GAME_ID);
    await setDoc(gameRef, {
      status: 'lobby',
      currentQuestionIndex: 0,
      questions: game.questions,
      redTeam: { score: 0, currentProgress: [], solved: false },
      blueTeam: { score: 0, currentProgress: [], solved: false },
      updatedAt: new Date().toISOString()
    });
  };

  const saveQuestions = async () => {
    const gameRef = doc(db, 'games', GAME_ID);
    await updateDoc(gameRef, { questions: editQuestions });
    setIsEditing(false);
  };

  const getTeamUrl = (team: 'red' | 'blue') => {
    try {
      // Prioritize the environment-provided APP_URL if valid, 
      // otherwise use the current full location (origin + path)
      const envAppUrl = process.env.APP_URL;
      const isPlaceholder = !envAppUrl || envAppUrl.includes('MY_APP_URL');
      
      let baseUrl = isPlaceholder 
        ? window.location.origin + window.location.pathname
        : envAppUrl;

      // SMART FIX: If the host is using the private 'ais-dev' URL,
      // automatically transform the generated links to the public 'ais-pre' URL.
      // This ensures students don't hit the login-required development wall.
      if (baseUrl.includes('ais-dev-')) {
        baseUrl = baseUrl.replace('ais-dev-', 'ais-pre-');
      }

      // Ensure baseUrl ends properly if we're joining paths
      if (!baseUrl.endsWith('/')) {
        // Only add / if there's no query string already
        if (!baseUrl.includes('?')) {
          baseUrl += '/';
        }
      }

      const url = new URL(baseUrl);
      url.searchParams.set('team', team);
      // Ensure we don't carry over headers or existing roles
      url.searchParams.delete('role');
      url.hash = ''; // Clear any internal hashes
      
      return url.href;
    } catch (e) {
      // Absolute fallback if everything fails
      const fallback = window.location.origin + window.location.pathname;
      let finalFallback = fallback;
      if (finalFallback.includes('ais-dev-')) {
        finalFallback = finalFallback.replace('ais-dev-', 'ais-pre-');
      }
      return `${finalFallback}${finalFallback.includes('?') ? '&' : '?'}team=${team}`;
    }
  };

  const isDevUrl = typeof window !== 'undefined' && window.location.origin.includes('ais-dev');

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900 overflow-hidden relative">
      {/* Header Section: Balanced Scoreboard */}
      <header className="h-24 bg-white border-b-2 border-slate-200 flex justify-between items-center px-12 relative z-10">
        {/* Red Team */}
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-red-500 rounded-none transform rotate-45 flex items-center justify-center shadow-lg shadow-red-100">
            <span className="text-white font-bold -rotate-45 text-xl">R</span>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Red Team Score</p>
            <p className="text-2xl font-black text-red-600">{game.redTeam.score} <span className="text-sm font-normal text-slate-400">pts</span></p>
          </div>
        </div>

        {/* Match Info */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-full flex flex-col items-center justify-center">
          {isDevUrl && (
            <div className="absolute -top-1 px-4 py-0.5 bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm">
              <AlertCircle className="w-2 h-2" /> Private Dev Mode
            </div>
          )}
          <div className="px-6 py-1 bg-slate-900 text-white text-[10px] uppercase tracking-[0.3em] mb-1 font-bold">
            {game.status === 'playing' ? 'Match in Progress' : 'Waiting for Start'}
          </div>
          <div className="text-xl font-mono font-bold text-slate-800 tracking-tighter uppercase">
            Phase: {game.status}
          </div>
        </div>

        {/* Blue Team */}
        <div className="flex items-center gap-5 flex-row-reverse text-right">
          <div className="w-12 h-12 bg-blue-600 rounded-none transform rotate-45 flex items-center justify-center shadow-lg shadow-blue-100">
            <span className="text-white font-bold -rotate-45 text-xl">B</span>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Blue Team Score</p>
            <p className="text-2xl font-black text-blue-600">{game.blueTeam.score} <span className="text-sm font-normal text-slate-400">pts</span></p>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Controls */}
        <div className="w-80 bg-white border-r-2 border-slate-200 p-8 flex flex-col gap-10">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Operations</h2>
              <div className="h-0.5 flex-1 bg-slate-100" />
            </div>
            <div className="space-y-4">
              {game.status === 'lobby' && (
                <button 
                  disabled={game.questions.length === 0}
                  onClick={startGame} 
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-none font-black uppercase tracking-widest hover:bg-black transition-all border-b-4 border-slate-700 active:border-b-0 active:translate-y-1 disabled:opacity-50"
                >
                  <Play className="w-4 h-4" /> Initialize
                </button>
              )}
              {game.status === 'playing' && (
                <button onClick={nextQuestion} className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-4 rounded-none font-black uppercase tracking-widest hover:bg-emerald-700 transition-all border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1">
                  Next Step <ChevronRight className="w-4 h-4" />
                </button>
              )}
              <button onClick={resetGame} className="w-full flex items-center justify-center gap-2 bg-white text-slate-400 border-2 border-slate-200 py-3 rounded-none font-bold uppercase tracking-widest hover:border-slate-400 hover:text-slate-600 transition-all">
                <RotateCcw className="w-4 h-4" /> Factory Reset
              </button>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Game Stream</h2>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => {
                  setEditQuestions(game.questions);
                  setIsEditing(true);
                }}
                className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-all group"
              >
                <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Modify Word List</span>
                <Settings className="w-4 h-4 text-slate-400 group-hover:text-slate-900" />
              </button>
            </div>
          </div>

          <div className="p-6 bg-slate-100 border-l-4 border-slate-900 group relative">
             <div className="flex items-center gap-2 mb-3">
                <LinkIcon className="w-4 h-4 text-slate-900" />
                <p className="text-[10px] items-center text-slate-900 font-black flex gap-2 uppercase tracking-widest">
                  Public Shared App
                </p>
             </div>
             <p className="text-[10px] text-slate-500 leading-relaxed font-bold uppercase tracking-tighter mb-4">
               To find your public URL, click the <span className="text-slate-900">Share</span> button at the top right of this screen.
             </p>
             <div className="space-y-2">
                <button 
                  onClick={() => {
                    const url = getTeamUrl('red');
                    navigator.clipboard.writeText(url);
                  }}
                  className="w-full py-2 bg-red-50 text-red-600 border border-red-200 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all transform active:scale-95"
                >
                  Copy Red Link
                </button>
                <button 
                  onClick={() => {
                    const url = getTeamUrl('blue');
                    navigator.clipboard.writeText(url);
                  }}
                  className="w-full py-2 bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all transform active:scale-95"
                >
                  Copy Blue Link
                </button>
             </div>
          </div>
        </div>

        {/* Main Viewing Area */}
        <main className="flex-1 overflow-y-auto p-16 flex flex-col items-center bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] relative">
          
          {game.status === 'lobby' ? (
            <div className="max-w-5xl w-full grid grid-cols-2 gap-16">
              <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="bg-white p-12 border-l-8 border-red-500 shadow-[20px_20px_0px_0px_rgba(239,68,68,0.05)] text-center flex flex-col items-center gap-8 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 transform rotate-45 translate-x-12 -translate-y-12" />
                <div className="w-16 h-16 bg-red-500 rotate-45 flex items-center justify-center text-white relative z-10">
                  <Users className="w-8 h-8 -rotate-45" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Red Leader</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">Scan to Synchronize</p>
                </div>
                <div className="p-4 bg-white border-2 border-slate-100 shadow-inner relative z-10">
                  <QRCodeSVG value={getTeamUrl('red')} size={180} />
                </div>
                <div className="relative z-10 w-full group">
                  <button 
                    onClick={() => navigator.clipboard.writeText(getTeamUrl('red'))}
                    className="text-[10px] font-mono text-slate-400 hover:text-red-500 transition-colors uppercase font-bold tracking-tight bg-slate-50 p-2 rounded w-full flex items-center justify-center gap-2"
                  >
                    <LinkIcon className="w-3 h-3" /> Copy Direct Link
                  </button>
                  <p className="mt-2 text-[8px] font-mono text-slate-300 break-all opacity-50 group-hover:opacity-100 transition-opacity">
                    {getTeamUrl('red')}
                  </p>
                </div>
              </motion.div>

              <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.1 }}
                 className="bg-white p-12 border-l-8 border-blue-600 shadow-[20px_20px_0px_0px_rgba(37,99,235,0.05)] text-center flex flex-col items-center gap-8 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 transform rotate-45 translate-x-12 -translate-y-12" />
                <div className="w-16 h-16 bg-blue-600 rotate-45 flex items-center justify-center text-white relative z-10">
                   <Users className="w-8 h-8 -rotate-45" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-2">Blue Leader</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">Scan to Synchronize</p>
                </div>
                <div className="p-4 bg-white border-2 border-slate-100 shadow-inner relative z-10">
                  <QRCodeSVG value={getTeamUrl('blue')} size={180} />
                </div>
                <div className="relative z-10 w-full group">
                  <button 
                    onClick={() => navigator.clipboard.writeText(getTeamUrl('blue'))}
                    className="text-[10px] font-mono text-slate-400 hover:text-blue-600 transition-colors uppercase font-bold tracking-tight bg-slate-50 p-2 rounded w-full flex items-center justify-center gap-2"
                  >
                    <LinkIcon className="w-3 h-3" /> Copy Direct Link
                  </button>
                  <p className="mt-2 text-[8px] font-mono text-slate-300 break-all opacity-50 group-hover:opacity-100 transition-opacity">
                    {getTeamUrl('blue')}
                  </p>
                </div>
              </motion.div>
            </div>
          ) : game.status === 'playing' ? (
            <div className="w-full max-w-4xl space-y-16">
              {/* Question Card */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full bg-white p-10 border-l-8 border-slate-900 shadow-[20px_20px_0px_0px_rgba(15,23,42,0.05)] relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <Monitor className="w-24 h-24" />
                </div>
                <div className="flex justify-between items-start mb-6">
                  <span className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em]">
                    Question {game.currentQuestionIndex + 1} / {game.questions.length}
                  </span>
                  <span className="text-slate-300 font-mono text-[10px] font-bold">UID: STRAT_{game.currentQuestionIndex + 100}</span>
                </div>
                <h2 className="text-3xl font-medium leading-relaxed text-slate-800 max-w-2xl">
                  {game.questions[game.currentQuestionIndex].text}
                </h2>
              </motion.div>

              <div className="grid grid-cols-1 gap-12">
                {/* Team Comparison Grid */}
                <div className="flex flex-col gap-10">
                   <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-red-500 rotate-45" />
                      <h3 className="text-sm font-black uppercase tracking-[0.4em] text-red-600">Red Team Progress</h3>
                   </div>
                   <div className="flex flex-wrap gap-4">
                      {game.redTeam.currentProgress.map((char, i) => (
                        <div key={i} className={`w-14 h-18 flex items-center justify-center text-4xl font-mono font-bold transition-all ${
                          char === '_' 
                            ? 'border-2 border-dashed border-slate-300 text-slate-200' 
                            : 'bg-slate-900 text-white shadow-lg'
                        }`}>
                          {char}
                        </div>
                      ))}
                   </div>
                </div>

                <div className="w-full h-0.5 bg-slate-200 dashed" />

                <div className="flex flex-col gap-10">
                   <div className="flex items-center gap-4 flex-row-reverse">
                      <div className="w-8 h-8 bg-blue-600 rotate-45" />
                      <h3 className="text-sm font-black uppercase tracking-[0.4em] text-blue-600">Blue Team Progress</h3>
                   </div>
                   <div className="flex flex-wrap gap-4 flex-row-reverse">
                      {game.blueTeam.currentProgress.map((char, i) => (
                        <div key={i} className={`w-14 h-18 flex items-center justify-center text-4xl font-mono font-bold transition-all ${
                          char === '_' 
                            ? 'border-2 border-dashed border-slate-300 text-slate-200' 
                            : 'bg-slate-900 text-white shadow-lg'
                        }`}>
                          {char}
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            </div>
          ) : (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-20 border-l-8 border-slate-900 shadow-[40px_40px_0px_0px_rgba(15,23,42,0.05)] text-center max-w-2xl w-full"
            >
              <Trophy className="w-20 h-20 text-slate-900 mx-auto mb-10" />
              <div className="px-6 py-2 bg-slate-900 text-white text-xs font-black uppercase tracking-[0.5em] mb-4 inline-block">
                Assignment Complete
              </div>
              <h1 className="text-5xl font-black text-slate-900 mb-10 tracking-tighter">THE WINNER IS</h1>
              <div className={`text-4xl font-black p-8 border-2 border-slate-900 inline-block px-16 ${
                game.winner === 'red' ? 'text-red-500 bg-red-50' : 
                game.winner === 'blue' ? 'text-blue-600 bg-blue-50' : 
                'text-slate-400 bg-slate-50'
              }`}>
                {game.winner === 'draw' ? "Dead Heat" : `${game.winner} Team`.toUpperCase()}
              </div>
              <button onClick={resetGame} className="flex items-center justify-center gap-3 mx-auto bg-slate-900 text-white px-10 py-5 rounded-none font-black hover:bg-black transition-all mt-12">
                <RotateCcw className="w-6 h-6" /> START NEW LECTURE
              </button>
            </motion.div>
          )}

          {/* Geometric Accents */}
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-slate-100 clip-path-polygon-[100%_0,0_100%,100%_100%] -z-10 opacity-50" />
          <div className="absolute top-0 left-0 w-32 h-32 bg-slate-100 clip-path-polygon-[0_0,100%_0,0_100%] -z-10 opacity-50" />
        </main>
      </div>

      {/* Footer Bar */}
      <footer className="h-16 bg-slate-900 flex justify-between items-center px-12 z-20">
        <div className="flex gap-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Cloud Sync: Active</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Latency: 24ms</span>
          </div>
        </div>
        <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </footer>

      {/* Questions Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-3xl max-h-[80vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                    <Settings className="w-6 h-6 text-indigo-500" /> Study Content Editor
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">Customize words and clues for your lecture</p>
                </div>
                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {editQuestions.map((q, idx) => (
                  <div key={idx} className="flex gap-4 p-6 bg-slate-50 rounded-3xl border border-slate-200 group">
                    <div className="pt-2">
                       <div className="w-8 h-8 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center text-xs font-bold font-mono">
                         {idx + 1}
                       </div>
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Question / Clue</label>
                        <textarea 
                          value={q.text}
                          onChange={(e) => {
                            const next = [...editQuestions];
                            next[idx].text = e.target.value;
                            setEditQuestions(next);
                          }}
                          className="w-full p-4 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                          rows={2}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Secret Answer</label>
                        <input 
                          type="text"
                          value={q.answer}
                          onChange={(e) => {
                            const next = [...editQuestions];
                            next[idx].answer = e.target.value.toUpperCase().replace(/[^A-Z]/g, '');
                            setEditQuestions(next);
                          }}
                          className="w-full p-4 rounded-xl border border-slate-200 bg-white text-sm font-black tracking-widest uppercase focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <button 
                        onClick={() => {
                          const next = [...editQuestions];
                          next.splice(idx, 1);
                          setEditQuestions(next);
                        }}
                        className="p-3 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
                
                <button 
                  onClick={() => setEditQuestions([...editQuestions, { text: '', answer: '' }])}
                  className="w-full py-6 border-2 border-dashed border-slate-200 text-slate-400 rounded-3xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all hover:border-slate-300"
                >
                  <Plus className="w-5 h-5" /> Add New Question
                </button>
              </div>

              <div className="p-8 border-t border-slate-100 flex gap-4 bg-slate-50">
                 <button onClick={() => setIsEditing(false)} className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all">
                    Cancel
                 </button>
                 <button onClick={saveQuestions} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                    <Save className="w-5 h-5" /> Save Changes
                 </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
