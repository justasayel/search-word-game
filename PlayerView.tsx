import { useState, useEffect } from 'react';
import { Game, TeamColor } from '../types';
import { db } from '../firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Check, Zap, AlertCircle, Users } from 'lucide-react';

interface Props {
  game: Game;
  teamColor: TeamColor;
}

const GAME_ID = 'main-class-game';

export default function PlayerView({ game, teamColor }: Props) {
  const team = teamColor === 'red' ? game.redTeam : game.blueTeam;
  const otherTeam = teamColor === 'red' ? game.blueTeam : game.redTeam;
  const currentQuestion = game.questions[game.currentQuestionIndex];
  const [error, setError] = useState(false);

  const handleCharClick = async (char: string) => {
    if (game.status !== 'playing' || team.solved) return;

    const answer = currentQuestion.answer.toUpperCase();
    const cleanChar = char.toUpperCase();

    // Check if the character exists in the answer and is not yet revealed in progress
    let found = false;
    const nextProgress = [...team.currentProgress];
    
    for (let i = 0; i < answer.length; i++) {
        if (answer[i] === cleanChar && nextProgress[i] === '_') {
            nextProgress[i] = cleanChar;
            found = true;
        }
    }

    if (found) {
      const isSolved = nextProgress.every(c => c !== '_');
      const updateData: any = {
        [`${teamColor}Team.currentProgress`]: nextProgress,
        updatedAt: new Date().toISOString()
      };

      if (isSolved && !team.solved) {
        updateData[`${teamColor}Team.solved`] = true;
        updateData[`${teamColor}Team.score`] = increment(1);
        updateData[`${teamColor}Team.lastSolvedAt`] = new Date().toISOString();
      }

      await updateDoc(doc(db, 'games', GAME_ID), updateData);
    } else {
      setError(true);
      setTimeout(() => setError(false), 500);
    }
  };

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  if (game.status === 'lobby') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-8 text-center bg-[radial-gradient(#e1e4e8_1px,transparent_1px)] [background-size:20px_20px]">
        <div className="p-12 bg-white border-l-8 border-slate-900 shadow-[20px_20px_0px_0px_rgba(15,23,42,0.05)] max-w-sm w-full relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 transform rotate-45 translate-x-12 -translate-y-12" />
          <div className="mb-8 flex justify-center">
             <div className={`w-16 h-16 ${teamColor === 'red' ? 'bg-red-500 shadow-red-100' : 'bg-blue-600 shadow-blue-100'} rotate-45 flex items-center justify-center text-white shadow-xl animate-pulse`}>
                <Zap className="w-8 h-8 -rotate-45" />
             </div>
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tighter italic">LOCKED IN</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-10">Synchronizing with Host...</p>
          <div className={`py-4 px-6 border-2 ${teamColor === 'red' ? 'border-red-500 text-red-600' : 'border-blue-600 text-blue-600'} font-black uppercase tracking-widest text-xs`}>
             {teamColor} Team Leader
          </div>
        </div>
      </div>
    );
  }

  if (game.status === 'finished') {
    const isWinner = game.winner === teamColor;
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-8 text-center">
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-16 border-l-8 border-slate-900 shadow-[30px_30px_0px_0px_rgba(15,23,42,0.05)] max-w-md w-full"
        >
          <div className="w-20 h-20 bg-slate-900 rotate-45 flex items-center justify-center text-white mx-auto mb-10">
            {isWinner ? <Trophy className="w-10 h-10 -rotate-45 text-amber-400" /> : <Zap className="w-10 h-10 -rotate-45" />}
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-4 uppercase tracking-tighter">{isWinner ? 'Victory' : 'Operational Finish'}</h1>
          <p className="text-slate-400 mb-10 font-bold uppercase tracking-widest text-xs">Score Artifacts: {team.score}</p>
          <div className={`text-sm font-black p-4 border-2 ${isWinner ? 'border-emerald-500 text-emerald-600 bg-emerald-50' : 'border-slate-200 text-slate-400 bg-slate-50'} uppercase tracking-[0.2em]`}>
            {isWinner ? 'Strategic Master' : 'Deployment Complete'}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${teamColor === 'red' ? 'bg-red-50' : 'bg-blue-50'} p-6 flex flex-col bg-[radial-gradient(#000000_1px,transparent_1px)] [background-size:32px_32px] [background-opacity:0.02]`}>
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col pt-4">
        {/* Progress Display */}
        <div className="bg-white p-10 shadow-[20px_20px_0px_0px_rgba(15,23,42,0.05)] mb-10 border-l-8 border-slate-900 text-center relative overflow-hidden">
          {error && <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }} className="absolute inset-0 bg-red-500/10 z-10 pointer-events-none" />}
          
          <div className="flex justify-between items-center mb-10">
            <div className={`px-4 py-1 border-2 ${teamColor === 'red' ? 'border-red-500 text-red-600' : 'border-blue-600 text-blue-600'} text-[10px] font-black tracking-[0.3em] uppercase bg-white`}>
                Active Unit: {teamColor}
            </div>
            <div className="font-mono font-bold text-slate-300 text-xs uppercase tracking-tight">
                Opponent Data: {otherTeam.score}
            </div>
          </div>

          <h2 className="text-2xl font-medium text-slate-800 mb-12 leading-relaxed text-left border-l-4 border-slate-100 pl-6 italic">
            {currentQuestion.text}
          </h2>

          <div className="flex flex-wrap justify-center gap-4 mb-6">
            {team.currentProgress.map((char, i) => (
              <motion.div 
                key={i}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className={`w-14 h-18 flex items-center justify-center text-4xl font-mono font-bold transition-all ${
                  char === '_' 
                    ? 'border-2 border-dashed border-slate-300 text-slate-200' 
                    : teamColor === 'red' ? 'bg-red-500 text-white' : 'bg-blue-600 text-white'
                } ${error && char === '_' ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
              >
                {char}
              </motion.div>
            ))}
          </div>

          <AnimatePresence>
            {team.solved && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center justify-center gap-3 text-emerald-600 font-black text-xs uppercase tracking-[0.4em] mt-8"
              >
                <Check className="w-5 h-5" /> Component Validated
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Grid / Keyboard */}
        <div className="flex-1 pb-12">
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-9">
              {alphabet.map((letter) => {
                const isSelected = team.currentProgress.includes(letter);
                return (
                  <button
                    key={letter}
                    disabled={team.solved || isSelected}
                    onClick={() => handleCharClick(letter)}
                    className={`h-14 flex items-center justify-center font-black transition-all active:scale-95 text-base sm:text-lg border-2 ${
                      isSelected 
                        ? 'border-slate-100 text-slate-200 bg-slate-50 cursor-not-allowed' 
                        : 'border-slate-900 bg-white text-slate-900 hover:bg-slate-900 hover:text-white shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1'
                    }`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
            
            <div className="mt-12 grid grid-cols-2 gap-8">
               <div className="p-6 bg-white border border-slate-200 flex items-center gap-5">
                  <div className={`w-10 h-10 border-2 ${teamColor === 'red' ? 'border-red-500' : 'border-blue-600'} rotate-45 flex items-center justify-center`}>
                    <Zap className={`w-5 h-5 -rotate-45 ${teamColor === 'red' ? 'text-red-500' : 'text-blue-600'}`} />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">Unit Score</p>
                    <p className="text-xl font-black text-slate-900">{team.score}</p>
                  </div>
               </div>
               <div className="p-6 bg-white border border-slate-200 flex items-center gap-5">
                  <div className="w-10 h-10 border-2 border-slate-200 rotate-45 flex items-center justify-center">
                    <Users className="w-5 h-5 -rotate-45 text-slate-300" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">Opposition</p>
                    <p className="text-xl font-black text-slate-900">{otherTeam.score}</p>
                  </div>
               </div>
            </div>
        </div>
      </div>
      
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
