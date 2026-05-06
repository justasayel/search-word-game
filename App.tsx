import { useEffect, useState } from 'react';
import { db } from './firebase';
import { doc, onSnapshot, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { Game, TeamColor } from './types';
import { INITIAL_QUESTIONS } from './constants';
import HostView from './components/HostView';
import PlayerView from './components/PlayerView';
import { Trophy, Users, Monitor, Link as LinkIcon, Zap, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const GAME_ID = 'main-class-game';

export default function App() {
  const [game, setGame] = useState<Game | null>(null);
  const [role, setRole] = useState<'host' | TeamColor | null>(null);

  useEffect(() => {
    const checkParams = () => {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get('role');
      const teamParam = params.get('team');

      if (roleParam === 'host') setRole('host');
      else if (teamParam === 'red') setRole('red');
      else if (teamParam === 'blue') setRole('blue');
      else setRole(null);
    };

    checkParams();
    window.addEventListener('popstate', checkParams);

    // Subscribe to game state
    const gameRef = doc(db, 'games', GAME_ID);
    const unsubscribe = onSnapshot(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        setGame({ id: snapshot.id, ...snapshot.data() } as Game);
      } else {
        // Initialize game if it doesn't exist
        const initialGame: Omit<Game, 'id'> = {
          status: 'lobby',
          currentQuestionIndex: 0,
          questions: INITIAL_QUESTIONS,
          redTeam: { score: 0, currentProgress: [], solved: false },
          blueTeam: { score: 0, currentProgress: [], solved: false },
          updatedAt: new Date().toISOString()
        };
        setDoc(gameRef, initialGame);
      }
    });

    return () => {
      unsubscribe();
      window.removeEventListener('popstate', checkParams);
    };
  }, []);

  if (!game) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="text-slate-400 font-medium"
        >
          Connecting to Game...
        </motion.div>
      </div>
    );
  }

  if (role === 'host') {
    return <HostView game={game} />;
  }

  if (role === 'red' || role === 'blue') {
    return <PlayerView game={game} teamColor={role} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] relative overflow-hidden">
      {/* Geometric Decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-slate-100 rotate-45 translate-x-32 -translate-y-32 -z-10" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-slate-100 rotate-45 -translate-x-24 translate-y-24 -z-10" />

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-md w-full bg-white border-l-8 border-slate-900 shadow-[40px_40px_0px_0px_rgba(15,23,42,0.05)] overflow-hidden"
      >
        <div className="bg-slate-900 p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 transform rotate-45 translate-x-12 -translate-y-12" />
          <div className="w-16 h-16 bg-white/10 rotate-45 flex items-center justify-center mx-auto mb-8">
             <Trophy className="w-8 h-8 text-amber-400 rotate-[-45deg]" />
          </div>
          <h1 className="text-4xl font-black text-white mb-2 leading-none uppercase tracking-tighter relative z-10 italic">
            Stratagem
          </h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] relative z-10">Unit Performance Simulation</p>
        </div>

        <div className="p-10 space-y-6">
          <button
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set('role', 'host');
              window.history.pushState({}, '', url);
              setRole('host');
            }}
            className="w-full flex items-center justify-between p-6 bg-white border-2 border-slate-200 hover:border-slate-900 transition-all group"
          >
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-slate-100 flex items-center justify-center transform rotate-45 group-hover:bg-slate-900 transition-all">
                <Monitor className="w-6 h-6 text-slate-600 group-hover:text-white -rotate-45" />
              </div>
              <div className="text-left">
                <span className="block font-black text-slate-900 uppercase text-sm tracking-tight">Host Terminal</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Master Control Unit</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-900" />
          </button>

          <div className="grid grid-cols-2 gap-6">
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set('team', 'red');
                window.history.pushState({}, '', url);
                setRole('red');
              }}
              className="flex flex-col items-center gap-4 p-10 bg-white border-2 border-slate-200 hover:border-red-500 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-8 h-8 bg-red-50 transform rotate-45 translate-x-4 -translate-y-4" />
              <div className="w-12 h-12 bg-red-500 flex items-center justify-center transform rotate-45 shadow-lg shadow-red-100">
                <Users className="w-6 h-6 text-white -rotate-45" />
              </div>
              <span className="font-black text-slate-900 uppercase text-[10px] tracking-widest group-hover:text-red-600">Red Unit</span>
            </button>

            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set('team', 'blue');
                window.history.pushState({}, '', url);
                setRole('blue');
              }}
              className="flex flex-col items-center gap-4 p-10 bg-white border-2 border-slate-200 hover:border-blue-600 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-8 h-8 bg-blue-50 transform rotate-45 translate-x-4 -translate-y-4" />
              <div className="w-12 h-12 bg-blue-600 flex items-center justify-center transform rotate-45 shadow-lg shadow-blue-100">
                <Users className="w-6 h-6 text-white -rotate-45" />
              </div>
              <span className="font-black text-slate-900 uppercase text-[10px] tracking-widest group-hover:text-blue-600">Blue Unit</span>
            </button>
          </div>
        </div>
      </motion.div>
      <div className="mt-16 flex items-center gap-6 opacity-20">
        <div className="w-12 h-1 bg-slate-900" />
        <p className="text-[10px] text-slate-900 font-black uppercase tracking-[0.5em]">Swiss Architectural Design // Version 2.0</p>
        <div className="w-12 h-1 bg-slate-900" />
      </div>
    </div>
  );
}
