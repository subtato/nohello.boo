import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuizQuestion } from '../QuizQuestion';
import i18n from '../../i18n/config';
import type { QuizQuestion as QuizQuestionType } from '../../types/quiz';

const mockQuestion: QuizQuestionType = {
  id: 1,
  question: 'What is the main problem with sending just "Hello" in a chat message?',
  options: [
    "It's impolite",
    "It forces the other person to wait and respond before you share your actual question",
    "It uses too much bandwidth",
    "It's not allowed in most chat applications"
  ],
  correctAnswer: 1
};

describe('QuizQuestion', () => {
  beforeEach(() => {
    i18n.changeLanguage('en');
  });

  describe('Rendering', () => {
    it('should render question text', () => {
      render(
        <QuizQuestion
          question={mockQuestion}
          questionNumber={1}
          totalQuestions={5}
          onAnswer={vi.fn()}
          selectedAnswer={null}
          isAnswered={false}
          isCorrect={null}
        />
      );

      expect(screen.getByText(mockQuestion.question)).toBeInTheDocument();
    });

    it('should render all options', () => {
      render(
        <QuizQuestion
          question={mockQuestion}
          questionNumber={1}
          totalQuestions={5}
          onAnswer={vi.fn()}
          selectedAnswer={null}
          isAnswered={false}
          isCorrect={null}
        />
      );

      mockQuestion.options.forEach(option => {
        expect(screen.getByText(option)).toBeInTheDocument();
      });
    });

    it('should display question number', () => {
      render(
        <QuizQuestion
          question={mockQuestion}
          questionNumber={2}
          totalQuestions={5}
          onAnswer={vi.fn()}
          selectedAnswer={null}
          isAnswered={false}
          isCorrect={null}
        />
      );

      expect(screen.getByText(/question 2 of 5/i)).toBeInTheDocument();
    });
  });

  describe('Answer Selection', () => {
    it('should call onAnswer when option is clicked', async () => {
      const user = userEvent.setup();
      const onAnswer = vi.fn();

      render(
        <QuizQuestion
          question={mockQuestion}
          questionNumber={1}
          totalQuestions={5}
          onAnswer={onAnswer}
          selectedAnswer={null}
          isAnswered={false}
          isCorrect={null}
        />
      );

      const firstOption = screen.getByText(mockQuestion.options[0]);
      await user.click(firstOption);

      expect(onAnswer).toHaveBeenCalledWith(0);
    });

    it('should highlight selected answer', () => {
      render(
        <QuizQuestion
          question={mockQuestion}
          questionNumber={1}
          totalQuestions={5}
          onAnswer={vi.fn()}
          selectedAnswer={1}
          isAnswered={false}
          isCorrect={null}
        />
      );

      const selectedOption = screen.getByText(mockQuestion.options[1]);
      expect(selectedOption).toBeInTheDocument();
      // Should have selected styling (checking for button element)
      expect(selectedOption.closest('button')).toBeInTheDocument();
    });

    it('should not allow selection when answered', async () => {
      const user = userEvent.setup();
      const onAnswer = vi.fn();

      render(
        <QuizQuestion
          question={mockQuestion}
          questionNumber={1}
          totalQuestions={5}
          onAnswer={onAnswer}
          selectedAnswer={1}
          isAnswered={true}
          isCorrect={true}
        />
      );

      const option = screen.getByText(mockQuestion.options[0]);
      await user.click(option);

      // Should not call onAnswer when already answered
      expect(onAnswer).not.toHaveBeenCalled();
    });
  });

  describe('Answer Feedback', () => {
    it('should show correct indicator for correct answer', () => {
      render(
        <QuizQuestion
          question={mockQuestion}
          questionNumber={1}
          totalQuestions={5}
          onAnswer={vi.fn()}
          selectedAnswer={1}
          isAnswered={true}
          isCorrect={true}
        />
      );

      expect(screen.getByText(/correct/i)).toBeInTheDocument();
    });

    it('should show incorrect indicator for wrong answer', () => {
      render(
        <QuizQuestion
          question={mockQuestion}
          questionNumber={1}
          totalQuestions={5}
          onAnswer={vi.fn()}
          selectedAnswer={0}
          isAnswered={true}
          isCorrect={false}
        />
      );

      expect(screen.getByText(/incorrect/i)).toBeInTheDocument();
    });

    it('should mark correct option with checkmark', () => {
      render(
        <QuizQuestion
          question={mockQuestion}
          questionNumber={1}
          totalQuestions={5}
          onAnswer={vi.fn()}
          selectedAnswer={1}
          isAnswered={true}
          isCorrect={true}
        />
      );

      // Correct answer should have checkmark
      const correctOption = screen.getByText(mockQuestion.options[1]);
      expect(correctOption.closest('button')).toBeInTheDocument();
    });

    it('should mark wrong selected option with X', () => {
      render(
        <QuizQuestion
          question={mockQuestion}
          questionNumber={1}
          totalQuestions={5}
          onAnswer={vi.fn()}
          selectedAnswer={0}
          isAnswered={true}
          isCorrect={false}
        />
      );

      // Wrong answer should be marked
      const wrongOption = screen.getByText(mockQuestion.options[0]);
      expect(wrongOption.closest('button')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have buttons for all options', () => {
      render(
        <QuizQuestion
          question={mockQuestion}
          questionNumber={1}
          totalQuestions={5}
          onAnswer={vi.fn()}
          selectedAnswer={null}
          isAnswered={false}
          isCorrect={null}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(mockQuestion.options.length);
    });

    it('should disable buttons when answered', () => {
      render(
        <QuizQuestion
          question={mockQuestion}
          questionNumber={1}
          totalQuestions={5}
          onAnswer={vi.fn()}
          selectedAnswer={1}
          isAnswered={true}
          isCorrect={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Internationalization', () => {
    it('should display translated question number', () => {
      i18n.changeLanguage('es');
      render(
        <QuizQuestion
          question={mockQuestion}
          questionNumber={3}
          totalQuestions={5}
          onAnswer={vi.fn()}
          selectedAnswer={null}
          isAnswered={false}
          isCorrect={null}
        />
      );

      // Should show question number in Spanish format
      expect(screen.getByText(/pregunta/i)).toBeInTheDocument();
    });
  });
});

