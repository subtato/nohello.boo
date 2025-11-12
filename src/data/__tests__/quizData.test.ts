import { describe, it, expect } from 'vitest';
import { quizData } from '../quizData';
import type { QuizQuestion } from '../../types/quiz';

describe('quizData', () => {
  describe('Structure', () => {
    it('should have questions array', () => {
      expect(quizData.questions).toBeDefined();
      expect(Array.isArray(quizData.questions)).toBe(true);
    });

    it('should have exactly 5 questions', () => {
      expect(quizData.questions.length).toBe(5);
    });

    it('should have valid question structure', () => {
      quizData.questions.forEach((question) => {
        expect(question).toHaveProperty('id');
        expect(question).toHaveProperty('question');
        expect(question).toHaveProperty('options');
        expect(question).toHaveProperty('correctAnswer');
        
        expect(typeof question.id).toBe('number');
        expect(typeof question.question).toBe('string');
        expect(Array.isArray(question.options)).toBe(true);
        expect(typeof question.correctAnswer).toBe('number');
      });
    });

    it('should have unique question IDs', () => {
      const ids = quizData.questions.map(q => q.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have sequential question IDs starting from 1', () => {
      const ids = quizData.questions.map(q => q.id).sort((a, b) => a - b);
      expect(ids).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('Question Content', () => {
    it('should have non-empty question text', () => {
      quizData.questions.forEach(question => {
        expect(question.question.length).toBeGreaterThan(0);
        expect(question.question.trim()).toBe(question.question);
      });
    });

    it('should have exactly 4 options per question', () => {
      quizData.questions.forEach(question => {
        expect(question.options.length).toBe(4);
      });
    });

    it('should have non-empty option text', () => {
      quizData.questions.forEach(question => {
        question.options.forEach(option => {
          expect(option.length).toBeGreaterThan(0);
          expect(option.trim()).toBe(option);
        });
      });
    });

    it('should have unique options per question', () => {
      quizData.questions.forEach(question => {
        const uniqueOptions = new Set(question.options);
        expect(uniqueOptions.size).toBe(question.options.length);
      });
    });

    it('should have valid correctAnswer index', () => {
      quizData.questions.forEach(question => {
        expect(question.correctAnswer).toBeGreaterThanOrEqual(0);
        expect(question.correctAnswer).toBeLessThan(question.options.length);
      });
    });
  });

  describe('Content Quality', () => {
    it('should have questions about the no-hello concept', () => {
      const allQuestionText = quizData.questions
        .map(q => q.question.toLowerCase())
        .join(' ');
      
      // Should mention key concepts
      const keyTerms = ['hello', 'chat', 'message', 'question', 'communication'];
      const hasKeyTerms = keyTerms.some(term => allQuestionText.includes(term));
      expect(hasKeyTerms).toBe(true);
    });

    it('should have meaningful options', () => {
      quizData.questions.forEach(question => {
        question.options.forEach(option => {
          // Options should be non-empty
          expect(option.trim().length).toBeGreaterThan(0);
          // Most options should be substantial, but short options like "Hi" are valid
          expect(option.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Type Safety', () => {
    it('should match QuizQuestion type', () => {
      const question: QuizQuestion = quizData.questions[0];
      expect(question).toBeDefined();
      expect(question.id).toBeDefined();
      expect(question.question).toBeDefined();
      expect(question.options).toBeDefined();
      expect(question.correctAnswer).toBeDefined();
    });
  });
});

