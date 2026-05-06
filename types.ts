export interface Question {
  text: string;
  answer: string;
}

export interface TeamState {
  score: number;
  currentProgress: string[]; // ['I', '_', 'C', ...]
  solved: boolean;
  lastSolvedAt?: string;
}

export interface Game {
  id: string;
  status: 'lobby' | 'playing' | 'finished';
  currentQuestionIndex: number;
  questions: Question[];
  redTeam: TeamState;
  blueTeam: TeamState;
  winner?: 'red' | 'blue' | 'draw';
  updatedAt: string;
}

export type TeamColor = 'red' | 'blue';
