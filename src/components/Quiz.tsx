import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/config';
import { QuizQuestion } from './QuizQuestion';
import { BlackjackVerification } from './BlackjackVerification';
import type { QuizState, VerificationState, QuizQuestion as QuizQuestionType } from '../types/quiz';

interface QuizProps {
  onClose: () => void;
}

export function Quiz({ onClose }: QuizProps) {
  const { t } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Map<number, number>>(new Map());
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [quizState, setQuizState] = useState<QuizState>('in-progress');
  const [verificationState, setVerificationState] = useState<VerificationState>('none');
  const [pendingQuestionIndex, setPendingQuestionIndex] = useState<number | null>(null);

  // Subscribe to language changes
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(lng);
    };
    
    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  // Load questions from translations
  const questions = useMemo(() => {
    const translatedQuestions = i18n.t('quiz.questions', { returnObjects: true }) as Array<{
      question: string;
      options: string[];
      correctAnswer: number;
    }>;
    
    // Add IDs to questions
    return translatedQuestions.map((q, index) => ({
      id: index + 1,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
    })) as QuizQuestionType[];
  }, [currentLanguage]);

  // Safety check: ensure questions are loaded
  if (!questions || questions.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 border-2 border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-lg text-gray-600 dark:text-gray-400">Loading quiz...</p>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = selectedAnswers.get(currentQuestion.id) ?? null;
  const isAnswered = answeredQuestions.has(currentQuestion.id);
  const isCorrect = useMemo(() => {
    if (!isAnswered || selectedAnswer === null) return null;
    return selectedAnswer === currentQuestion.correctAnswer;
  }, [isAnswered, selectedAnswer, currentQuestion.correctAnswer]);

  const handleAnswer = (answerIndex: number) => {
    setSelectedAnswers(prev => new Map(prev).set(currentQuestion.id, answerIndex));
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    const correct = selectedAnswer === currentQuestion.correctAnswer;
    setAnsweredQuestions(prev => new Set(prev).add(currentQuestion.id));

    if (!correct) {
      // Wrong answer - trigger verification
      setPendingQuestionIndex(currentQuestionIndex);
      setVerificationState('required');
    } else {
      // Correct answer - move to next question or complete
      handleNextQuestion();
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Quiz completed
      setQuizState('completed');
    }
  };

  const handleVerificationPassed = () => {
    setVerificationState('passed');
    // Allow user to retry the question
    if (pendingQuestionIndex !== null) {
      const questionToRetry = questions[pendingQuestionIndex];
      setSelectedAnswers(prev => {
        const newMap = new Map(prev);
        newMap.delete(questionToRetry.id);
        return newMap;
      });
      setAnsweredQuestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(questionToRetry.id);
        return newSet;
      });
      setCurrentQuestionIndex(pendingQuestionIndex);
      setPendingQuestionIndex(null);
    }
    setVerificationState('none');
  };

  const progress = ((currentQuestionIndex + (isAnswered ? 1 : 0)) / questions.length) * 100;

  if (quizState === 'completed') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 border-2 border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              {t('quiz.completed.title')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              {t('quiz.completed.message')}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg cursor-pointer"
            >
              {t('quiz.completed.close')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-3xl w-full mx-4 border-2 border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {t('quiz.title')}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl font-bold transition-colors cursor-pointer"
              aria-label={t('quiz.close')}
            >
              ×
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
              <span>{t('quiz.progress', { current: currentQuestionIndex + 1, total: questions.length })}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <QuizQuestion
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
            onAnswer={handleAnswer}
            selectedAnswer={selectedAnswer}
            isAnswered={isAnswered}
            isCorrect={isCorrect}
          />

          {/* Submit Button - Always visible to prevent layout shift */}
          {!isAnswered && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSubmitAnswer}
                disabled={selectedAnswer === null}
                className={`px-6 py-3 font-semibold rounded-lg transition-all duration-200 shadow-md ${
                  selectedAnswer === null
                    ? 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-400 cursor-not-allowed opacity-60'
                    : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg cursor-pointer'
                }`}
              >
                {t('quiz.submit')}
              </button>
            </div>
          )}

          {/* Next Button */}
          {isAnswered && isCorrect && currentQuestionIndex < questions.length - 1 && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleNextQuestion}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg cursor-pointer"
              >
                {t('quiz.next')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Blackjack Verification Modal */}
      {verificationState === 'required' && (
        <BlackjackVerification onVerificationPassed={handleVerificationPassed} />
      )}
    </>
  );
}

