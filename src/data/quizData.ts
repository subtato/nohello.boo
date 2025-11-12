import type { QuizData } from '../types/quiz';

export const quizData: QuizData = {
  questions: [
    {
      id: 1,
      question: "What is the main problem with sending just 'Hello' in a chat message?",
      options: [
        "It's impolite",
        "It forces the other person to wait and respond before you share your actual question",
        "It uses too much bandwidth",
        "It's not allowed in most chat applications"
      ],
      correctAnswer: 1
    },
    {
      id: 2,
      question: "What should you include in your first message instead of just saying 'Hello'?",
      options: [
        "Your full name and contact information",
        "Your question or request",
        "A greeting in multiple languages",
        "An emoji"
      ],
      correctAnswer: 1
    },
    {
      id: 3,
      question: "Which of these is an example of a good first message?",
      options: [
        "Hi",
        "Hello - I'm having trouble with the login form. When I submit it, nothing happens. Can you take a look?",
        "Are you there?",
        "Got a minute?"
      ],
      correctAnswer: 1
    },
    {
      id: 4,
      question: "Why is including your question in the first message beneficial?",
      options: [
        "It makes you look smarter",
        "The other person can start thinking about your question immediately, respond when they have time, and you get your answer faster",
        "It prevents spam",
        "It's required by chat platform rules"
      ],
      correctAnswer: 1
    },
    {
      id: 5,
      question: "In asynchronous communication, what is everything?",
      options: [
        "Speed",
        "Context",
        "Length",
        "Emojis"
      ],
      correctAnswer: 1
    }
  ]
};

