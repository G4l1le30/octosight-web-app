export interface EducationArticle {
  id: number;
  title: string;
  url: string;
  author: string;
  duration_mins: number;
  publication_date?: string;
  description?: string;
}

export interface EducationModuleWithProgress {
  id: number;
  title: string;
  level: "BASIC" | "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  order_index: number;
  description: string;
  duration_mins: number;
  articles: EducationArticle[];
  status: "LOCKED" | "IN_PROGRESS" | "COMPLETED";
  quiz_score?: number;
  completed_at?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer_index: number;
  explanation: string;
}

export interface QuizResponse {
  questions: QuizQuestion[];
}

export interface QuizResult {
  score: number;
  total_questions: number;
  correct_answers: number;
  questions_with_explanations: {
    question: string;
    selected_answer_index: number;
    correct_answer_index: number;
    is_correct: boolean;
    explanation: string;
  }[];
  passed: boolean;
}

export interface EducationRecommendation {
  warnings: string[];
  suggested_actions: string[];
  tips: string[];
  relevant_modules: number[];
}