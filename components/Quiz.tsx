
import React, { useState } from 'react';
import { QuizQuestion } from '../types';

interface Props {
  questions: QuizQuestion[];
}

export const Quiz: React.FC<Props> = ({ questions }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const currentQ = questions[currentIndex];

  const handleOptionSelect = (key: string) => {
    if (isSubmitted) return;
    setSelectedOption(key);
  };

  const handleSubmit = () => {
    if (!selectedOption) return;
    setIsSubmitted(true);
    if (selectedOption === currentQ.correct_answer) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
    } else {
      setQuizFinished(true);
    }
  };

  if (quizFinished) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-xl border border-slate-100 max-w-2xl mx-auto">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Quiz Completed!</h2>
        <p className="text-slate-500 mb-8 text-center text-lg">
          You scored <span className="font-bold text-indigo-600">{score}</span> out of {questions.length}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:bg-indigo-700 transition-colors"
        >
          Study Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
      <div className="h-2 bg-slate-100 w-full">
        <div 
          className="h-full bg-indigo-500 transition-all duration-300" 
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="p-8 md:p-12">
        <div className="flex justify-between items-center mb-6">
          <span className="text-sm font-bold text-indigo-600 uppercase tracking-widest">Question {currentIndex + 1} of {questions.length}</span>
          <span className="text-sm text-slate-400">Score: {score}</span>
        </div>

        <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-8 leading-tight">
          {currentQ.question}
        </h3>

        <div className="space-y-4 mb-10">
          {Object.entries(currentQ.options).map(([key, value]) => {
            let bgColor = "bg-slate-50 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50";
            let textColor = "text-slate-700";
            
            if (selectedOption === key) {
              bgColor = "bg-indigo-600 border-indigo-600";
              textColor = "text-white";
            }

            if (isSubmitted) {
              if (key === currentQ.correct_answer) {
                bgColor = "bg-green-100 border-green-500 ring-2 ring-green-200";
                textColor = "text-green-800";
              } else if (selectedOption === key && key !== currentQ.correct_answer) {
                bgColor = "bg-red-100 border-red-500 ring-2 ring-red-200";
                textColor = "text-red-800";
              } else {
                bgColor = "bg-slate-50 border-slate-200 opacity-50";
                textColor = "text-slate-400";
              }
            }

            return (
              <button
                key={key}
                disabled={isSubmitted}
                onClick={() => handleOptionSelect(key)}
                className={`w-full flex items-center p-5 border-2 rounded-2xl transition-all duration-200 text-left ${bgColor} ${textColor}`}
              >
                <span className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl font-bold mr-4 ${selectedOption === key && !isSubmitted ? 'bg-indigo-500 text-white' : 'bg-white/50'}`}>
                  {key}
                </span>
                <span className="font-medium text-lg">{value}</span>
              </button>
            );
          })}
        </div>

        {isSubmitted && (
          <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-bottom-2">
            <h4 className="font-bold text-slate-800 mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Explanation
            </h4>
            <p className="text-slate-600 leading-relaxed">{currentQ.explanation}</p>
          </div>
        )}

        <div className="flex justify-end">
          {!isSubmitted ? (
            <button
              onClick={handleSubmit}
              disabled={!selectedOption}
              className={`px-10 py-4 font-bold rounded-2xl shadow-lg transition-all ${!selectedOption ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 active:scale-95'}`}
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-10 py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all flex items-center"
            >
              {currentIndex < questions.length - 1 ? 'Next Question' : 'View Results'}
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
