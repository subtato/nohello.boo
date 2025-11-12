export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number; // Index of the correct answer
}

export interface QuizData {
  questions: QuizQuestion[];
}

export type QuizState = 'not-started' | 'in-progress' | 'completed';
export type VerificationState = 'none' | 'required' | 'in-progress' | 'passed';

export interface BlackjackHand {
  cards: number[];
  total: number;
  isBusted: boolean;
  isBlackjack: boolean;
}

export interface BlackjackGameState {
  playerHand: BlackjackHand;
  dealerHand: BlackjackHand;
  gameStatus: 'playing' | 'player-won' | 'dealer-won' | 'tie';
  isDealerRevealed: boolean;
}

