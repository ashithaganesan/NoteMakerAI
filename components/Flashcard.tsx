
import React, { useState } from 'react';
import { Flashcard as FlashcardType } from '../types';

interface Props {
  card: FlashcardType;
}

export const Flashcard: React.FC<Props> = ({ card }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="relative w-full h-64 cursor-pointer perspective-1000"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className={`relative w-full h-full transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
        {/* Front */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-white border-2 border-indigo-100 rounded-2xl shadow-sm backface-hidden">
          <span className="mb-4 text-xs font-bold tracking-widest text-indigo-500 uppercase">Question</span>
          <p className="text-lg font-semibold text-center text-slate-800">{card.question}</p>
          <p className="mt-8 text-sm text-slate-400">Click to reveal answer</p>
        </div>
        
        {/* Back */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-indigo-600 border-2 border-indigo-700 rounded-2xl shadow-lg backface-hidden rotate-y-180">
          <span className="mb-4 text-xs font-bold tracking-widest text-indigo-200 uppercase">Answer</span>
          <p className="text-lg font-medium text-center text-white">{card.answer}</p>
        </div>
      </div>
    </div>
  );
};
