
export interface Flashcard {
  question: string;
  answer: string;
}

export interface QuizQuestion {
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_answer: string;
  explanation: string;
}

export interface StudyData {
  summary?: string[];
  flashcards?: Flashcard[];
  quiz?: QuizQuestion[];
  audioScript?: string;
}

export type AppState = 'input' | 'dashboard';
export type TabType = 'summary' | 'flashcards' | 'quiz' | 'audio';
