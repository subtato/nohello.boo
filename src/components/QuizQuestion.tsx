import { useTranslation } from 'react-i18next';
import type { QuizQuestion as QuizQuestionType } from '../types/quiz';

interface QuizQuestionProps {
  question: QuizQuestionType;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (answerIndex: number) => void;
  selectedAnswer: number | null;
  isAnswered: boolean;
  isCorrect: boolean | null;
}

export function QuizQuestion({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  selectedAnswer,
  isAnswered,
  isCorrect,
}: QuizQuestionProps) {
  const { t } = useTranslation();

  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
          {t('quiz.questionNumber', { current: questionNumber, total: totalQuestions })}
        </div>
        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
          {question.question}
        </h3>
      </div>

      <div className="space-y-3">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isCorrectOption = index === question.correctAnswer;
          let buttonClass = 'w-full text-left p-4 rounded-xl border-2 transition-all duration-200 font-medium relative ';

          if (!isAnswered) {
            // Before answering: show selection state clearly
            if (isSelected) {
              buttonClass +=
                'border-blue-600 dark:border-blue-500 bg-blue-100 dark:bg-blue-900/40 shadow-lg ring-2 ring-blue-500 dark:ring-blue-400 ring-opacity-50 cursor-pointer ';
            } else {
              buttonClass +=
                'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer ';
            }
          } else {
            // After answering: show results but keep buttons visible
            if (isCorrectOption) {
              buttonClass += 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20 ';
            } else if (isSelected && !isCorrect) {
              buttonClass += 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20 ';
            } else {
              buttonClass += 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 opacity-60 ';
            }
            buttonClass += 'cursor-not-allowed';
          }

          return (
            <button
              key={index}
              onClick={() => !isAnswered && onAnswer(index)}
              disabled={isAnswered}
              className={buttonClass}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {/* Selection indicator */}
                  {isSelected && !isAnswered && (
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 dark:bg-blue-500 border-2 border-blue-700 dark:border-blue-400 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                  )}
                  <span className="text-gray-900 dark:text-gray-100">{option}</span>
                </div>
                {/* Result indicators */}
                {isAnswered && isCorrectOption && (
                  <span className="text-green-600 dark:text-green-400 text-xl font-bold ml-2">✓</span>
                )}
                {isAnswered && isSelected && !isCorrect && (
                  <span className="text-red-600 dark:text-red-400 text-xl font-bold ml-2">✗</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div className={`mt-6 p-4 rounded-xl ${isCorrect ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
          <p className={`font-semibold ${isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
            {isCorrect ? t('quiz.correctAnswer') : t('quiz.incorrectAnswer')}
          </p>
        </div>
      )}
    </div>
  );
}

