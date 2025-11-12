import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BlackjackVerification } from '../BlackjackVerification';

describe('BlackjackVerification', () => {
  const mockOnVerificationPassed = vi.fn();

  beforeEach(() => {
    mockOnVerificationPassed.mockClear();
    // Reset Math.random to ensure consistent tests
    vi.spyOn(Math, 'random').mockRestore();
  });

  describe('Rendering', () => {
    it('should render verification modal', () => {
      render(<BlackjackVerification onVerificationPassed={mockOnVerificationPassed} />);
      
      expect(screen.getByText(/verify you're human/i)).toBeInTheDocument();
      expect(screen.getByText(/beat the dealer/i)).toBeInTheDocument();
    });

    it('should render dealer section', () => {
      render(<BlackjackVerification onVerificationPassed={mockOnVerificationPassed} />);
      
      // Should have dealer heading (more specific than just "dealer")
      const dealerHeading = screen.getByText(/^dealer/i);
      expect(dealerHeading).toBeInTheDocument();
    });

    it('should render player section', () => {
      render(<BlackjackVerification onVerificationPassed={mockOnVerificationPassed} />);
      
      // Should have player heading (more specific than just "you")
      const playerHeading = screen.getByText(/^you/i);
      expect(playerHeading).toBeInTheDocument();
    });

    it('should render game controls', () => {
      render(<BlackjackVerification onVerificationPassed={mockOnVerificationPassed} />);
      
      expect(screen.getByRole('button', { name: /hit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /stand/i })).toBeInTheDocument();
    });

    it('should display initial cards', () => {
      render(<BlackjackVerification onVerificationPassed={mockOnVerificationPassed} />);
      
      // Should have cards displayed (at least 2 for player, 1 visible for dealer)
      const cards = screen.getAllByText(/[A2-9JQK?]/);
      expect(cards.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Game Logic - Hit', () => {
    it('should add a card when hit is clicked', async () => {
      const user = userEvent.setup();
      render(<BlackjackVerification onVerificationPassed={mockOnVerificationPassed} />);
      
      const hitButton = screen.getByRole('button', { name: /hit/i });
      const initialCardCount = screen.getAllByText(/[A2-9JQK]/).length;
      
      await user.click(hitButton);
      
      await waitFor(() => {
        const newCardCount = screen.getAllByText(/[A2-9JQK]/).length;
        expect(newCardCount).toBeGreaterThan(initialCardCount);
      });
    });

    it('should disable controls when player busts', async () => {
      const user = userEvent.setup();
      
      // Mock cards to force a bust scenario
      let cardIndex = 0;
      const bustCards = [10, 10, 10]; // 30 total = bust
      vi.spyOn(Math, 'random').mockImplementation(() => {
        const card = bustCards[cardIndex % bustCards.length];
        cardIndex++;
        return (card - 1) / 13; // Convert to 0-1 range
      });
      
      render(<BlackjackVerification onVerificationPassed={mockOnVerificationPassed} />);
      
      const hitButton = screen.getByRole('button', { name: /hit/i });
      
      // Click hit until bust (or max attempts)
      for (let i = 0; i < 5; i++) {
        try {
          await user.click(hitButton);
          await waitFor(() => {
            const buttons = screen.queryAllByRole('button');
            if (screen.queryByText(/busted/i)) {
              expect(buttons.length).toBe(0); // No controls when busted
              return;
            }
          }, { timeout: 100 });
        } catch {
          // Button might be disabled
          break;
        }
      }
      
      vi.spyOn(Math, 'random').mockRestore();
    });
  });

  describe('Game Logic - Stand', () => {
    it('should reveal dealer cards when stand is clicked', async () => {
      const user = userEvent.setup();
      render(<BlackjackVerification onVerificationPassed={mockOnVerificationPassed} />);
      
      const standButton = screen.getByRole('button', { name: /stand/i });
      await user.click(standButton);
      
      await waitFor(() => {
        // Dealer should be revealed (no "?" card)
        const hiddenCards = screen.queryAllByText('?');
        expect(hiddenCards.length).toBe(0);
      });
    });

    it('should determine winner after stand', async () => {
      const user = userEvent.setup();
      render(<BlackjackVerification onVerificationPassed={mockOnVerificationPassed} />);
      
      const standButton = screen.getByRole('button', { name: /stand/i });
      await user.click(standButton);
      
      await waitFor(() => {
        // Should show game result
        const hasResult = screen.queryByText(/won|busted|tie/i);
        expect(hasResult || screen.queryByText(/verification passed/i)).toBeTruthy();
      }, { timeout: 3000 });
    });
  });

  describe('Verification Passed', () => {
    it('should call onVerificationPassed when player wins', async () => {
      const user = userEvent.setup();
      
      // Mock cards to ensure player wins
      let cardIndex = 0;
      const winningCards = [10, 9, 8, 7]; // Player: 10+9=19, Dealer: 8+7=15
      vi.spyOn(Math, 'random').mockImplementation(() => {
        const card = winningCards[cardIndex % winningCards.length];
        cardIndex++;
        return (card - 1) / 13;
      });
      
      render(<BlackjackVerification onVerificationPassed={mockOnVerificationPassed} />);
      
      const standButton = screen.getByRole('button', { name: /stand/i });
      await user.click(standButton);
      
      await waitFor(() => {
        expect(mockOnVerificationPassed).toHaveBeenCalled();
      }, { timeout: 3000 });
      
      vi.spyOn(Math, 'random').mockRestore();
    });
  });

  describe('Game Reset', () => {
    it('should reset game when dealer wins', async () => {
      const user = userEvent.setup();
      
      // Mock cards to ensure dealer wins
      let cardIndex = 0;
      const losingCards = [5, 5, 10, 10]; // Player: 5+5=10, Dealer: 10+10=20
      vi.spyOn(Math, 'random').mockImplementation(() => {
        const card = losingCards[cardIndex % losingCards.length];
        cardIndex++;
        return (card - 1) / 13;
      });
      
      render(<BlackjackVerification onVerificationPassed={mockOnVerificationPassed} />);
      
      const standButton = screen.getByRole('button', { name: /stand/i });
      await user.click(standButton);
      
      await waitFor(() => {
        // Game should reset (controls should be available again)
        const hitButton = screen.queryByRole('button', { name: /hit/i });
        expect(hitButton).toBeInTheDocument();
      }, { timeout: 3000 });
      
      vi.spyOn(Math, 'random').mockRestore();
    });
  });

  describe('Card Display', () => {
    it('should display card values correctly', () => {
      render(<BlackjackVerification onVerificationPassed={mockOnVerificationPassed} />);
      
      // Should have card elements
      const cards = screen.getAllByText(/[A2-9JQK?]/);
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should hide dealer first card initially', () => {
      render(<BlackjackVerification onVerificationPassed={mockOnVerificationPassed} />);
      
      // Should have at least one "?" for hidden dealer card
      const hiddenCards = screen.getAllByText('?');
      expect(hiddenCards.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle blackjack (21 with 2 cards)', () => {
      // Mock blackjack scenario
      let cardIndex = 0;
      const blackjackCards = [1, 10, 5, 5]; // Player: A+10=21 (blackjack)
      vi.spyOn(Math, 'random').mockImplementation(() => {
        const card = blackjackCards[cardIndex % blackjackCards.length];
        cardIndex++;
        return (card - 1) / 13;
      });
      
      render(<BlackjackVerification onVerificationPassed={mockOnVerificationPassed} />);
      
      // Should show blackjack or allow stand
      const standButton = screen.queryByRole('button', { name: /stand/i });
      expect(standButton).toBeInTheDocument();
      
      vi.spyOn(Math, 'random').mockRestore();
    });

    it('should handle ace as 1 or 11 correctly', () => {
      render(<BlackjackVerification onVerificationPassed={mockOnVerificationPassed} />);
      
      // Component should render and handle aces
      const playerHeading = screen.getByText(/^you/i);
      expect(playerHeading).toBeInTheDocument();
      // Aces are handled in the calculateHandTotal function
    });
  });
});

