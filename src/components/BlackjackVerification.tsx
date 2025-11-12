import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/config';
import type { BlackjackGameState, BlackjackHand } from '../types/quiz';

interface BlackjackVerificationProps {
  onVerificationPassed: () => void;
}

// Get a random card value (1-13, where 1 is Ace, 11-13 are face cards worth 10)
function getRandomCard(): number {
  return Math.floor(Math.random() * 13) + 1;
}

// Calculate hand total (Aces can be 1 or 11, face cards are worth 10)
function calculateHandTotal(cards: number[]): { total: number; isBusted: boolean; isBlackjack: boolean } {
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    if (card === 1) {
      // Ace
      aces++;
      total += 11;
    } else if (card >= 11) {
      // Face cards (Jack, Queen, King) are worth 10
      total += 10;
    } else {
      // Number cards (2-10) are worth their face value
      total += card;
    }
  }

  // Adjust for aces
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  const isBusted = total > 21;
  const isBlackjack = cards.length === 2 && total === 21;

  return { total, isBusted, isBlackjack };
}

// Create initial hand
function createHand(): BlackjackHand {
  const cards = [getRandomCard(), getRandomCard()];
  const { total, isBusted, isBlackjack } = calculateHandTotal(cards);
  return { cards, total, isBusted, isBlackjack };
}

export function BlackjackVerification({ onVerificationPassed }: BlackjackVerificationProps) {
  const { t } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  
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

  // Memoize translations to prevent recalculation on every render
  const translations = useMemo(() => ({
    title: t('blackjack.title'),
    description: t('blackjack.description'),
    dealer: t('blackjack.dealer'),
    you: t('blackjack.you'),
    dealerBusted: t('blackjack.dealerBusted'),
    youBusted: t('blackjack.youBusted'),
    blackjack: t('blackjack.blackjack'),
    playerWon: t('blackjack.playerWon'),
    dealerWon: t('blackjack.dealerWon'),
    tie: t('blackjack.tie'),
    hit: t('blackjack.hit'),
    stand: t('blackjack.stand'),
  }), [currentLanguage, t]);

  const [gameState, setGameState] = useState<BlackjackGameState>(() => {
    const playerHand = createHand();
    const dealerHand = createHand();
    return {
      playerHand,
      dealerHand,
      gameStatus: 'playing',
      isDealerRevealed: false,
    };
  });

  // Function to play dealer's turn and determine winner
  const playDealerTurn = useCallback((currentPlayerHand: BlackjackHand) => {
    setGameState(prev => {
      // Reveal dealer and play dealer's turn
      let dealerCards = [...prev.dealerHand.cards];
      let dealerTotal = calculateHandTotal(dealerCards).total;

      // Dealer hits until 17 or higher
      while (dealerTotal < 17) {
        const newCard = getRandomCard();
        dealerCards.push(newCard);
        dealerTotal = calculateHandTotal(dealerCards).total;
      }

      const { total, isBusted } = calculateHandTotal(dealerCards);
      const dealerHand: BlackjackHand = {
        cards: dealerCards,
        total,
        isBusted,
        isBlackjack: dealerCards.length === 2 && total === 21,
      };

      // Determine winner
      let gameStatus: 'player-won' | 'dealer-won' | 'tie' = 'tie';
      
      // Special case: if both have blackjack, it's a tie
      if (currentPlayerHand.isBlackjack && dealerHand.isBlackjack) {
        gameStatus = 'tie';
      } else if (currentPlayerHand.isBlackjack) {
        // Player has blackjack and dealer doesn't, player wins
        gameStatus = 'player-won';
      } else if (dealerHand.isBusted || currentPlayerHand.total > dealerHand.total) {
        gameStatus = 'player-won';
      } else if (dealerHand.total > currentPlayerHand.total) {
        gameStatus = 'dealer-won';
      }

      return {
        playerHand: currentPlayerHand,
        dealerHand,
        gameStatus,
        isDealerRevealed: true,
      };
    });
  }, []);

  // Dealer plays automatically after player stands, if player has 21, or if player busted
  useEffect(() => {
    if (gameState.gameStatus === 'playing' && !gameState.isDealerRevealed) {
      if (gameState.playerHand.isBusted) {
        // Player busted, dealer wins
        setGameState(prev => ({
          ...prev,
          gameStatus: 'dealer-won',
          isDealerRevealed: true,
        }));
      } else if (gameState.playerHand.total === 21) {
        // Player has 21 (blackjack or otherwise), automatically play dealer's turn
        playDealerTurn(gameState.playerHand);
      }
    }
  }, [gameState.gameStatus, gameState.isDealerRevealed, gameState.playerHand.isBusted, gameState.playerHand.total, playDealerTurn]);

  const handleHit = () => {
    if (gameState.gameStatus !== 'playing' || gameState.playerHand.isBusted || gameState.playerHand.total === 21) return;

    const newCard = getRandomCard();
    const newCards = [...gameState.playerHand.cards, newCard];
    const { total, isBusted, isBlackjack } = calculateHandTotal(newCards);

    const newPlayerHand: BlackjackHand = {
      cards: newCards,
      total,
      isBusted,
      isBlackjack,
    };

    if (isBusted) {
      // Player busted, reveal dealer and end game
      setGameState(prev => ({
        ...prev,
        playerHand: newPlayerHand,
        gameStatus: 'dealer-won',
        isDealerRevealed: true,
      }));
    } else {
      setGameState(prev => ({
        ...prev,
        playerHand: newPlayerHand,
      }));
    }
  };

  const handleStand = () => {
    if (gameState.gameStatus !== 'playing' || gameState.isDealerRevealed || gameState.playerHand.total === 21) return;

    playDealerTurn(gameState.playerHand);
  };

  // Handle game result
  useEffect(() => {
    if (gameState.gameStatus === 'player-won') {
      // Player won, verification passed
      const timer = setTimeout(() => {
        onVerificationPassed();
      }, 1500);
      return () => clearTimeout(timer);
    } else if (gameState.gameStatus === 'dealer-won' || gameState.gameStatus === 'tie') {
      // Dealer won or tie, reset game
      const timer = setTimeout(() => {
        const newPlayerHand = createHand();
        const newDealerHand = createHand();
        setGameState({
          playerHand: newPlayerHand,
          dealerHand: newDealerHand,
          gameStatus: 'playing',
          isDealerRevealed: false,
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [gameState.gameStatus, onVerificationPassed]);

  const renderCard = (value: number, index: number) => {
    let displayValue: string;
    if (value === 1) {
      displayValue = 'A';
    } else if (value === 11) {
      displayValue = 'J';
    } else if (value === 12) {
      displayValue = 'Q';
    } else if (value === 13) {
      displayValue = 'K';
    } else {
      displayValue = value.toString();
    }
    
    return (
      <div
        key={index}
        className="w-16 h-24 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center text-2xl font-bold text-gray-900 dark:text-gray-100 shadow-md"
      >
        {displayValue}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 border-2 border-gray-200 dark:border-gray-700">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">
          {translations.title}
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
          {translations.description}
        </p>

        {/* Dealer Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">
            {translations.dealer} {gameState.isDealerRevealed && `(${gameState.dealerHand.total})`}
          </h3>
          <div className="flex gap-2 flex-wrap">
            {gameState.dealerHand.cards.map((card, index) => {
              if (!gameState.isDealerRevealed && index === 0) {
                return (
                  <div
                    key={index}
                    className="w-16 h-24 bg-gradient-to-br from-blue-500 to-blue-700 border-2 border-blue-600 rounded-lg flex items-center justify-center text-2xl font-bold text-white shadow-md"
                  >
                    ?
                  </div>
                );
              }
              return renderCard(card, index);
            })}
          </div>
          {gameState.isDealerRevealed && gameState.dealerHand.isBusted && (
            <p className="text-red-600 dark:text-red-400 font-semibold mt-2">{translations.dealerBusted}</p>
          )}
        </div>

        {/* Player Section */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">
            {translations.you} ({gameState.playerHand.total})
          </h3>
          <div className="flex gap-2 flex-wrap">
            {gameState.playerHand.cards.map((card, index) => renderCard(card, index))}
          </div>
          {gameState.playerHand.isBusted && (
            <p className="text-red-600 dark:text-red-400 font-semibold mt-2">{translations.youBusted}</p>
          )}
          {gameState.playerHand.isBlackjack && (
            <p className="text-green-600 dark:text-green-400 font-semibold mt-2">{translations.blackjack}</p>
          )}
        </div>

        {/* Game Status */}
        {gameState.gameStatus === 'player-won' && (
          <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 rounded-lg text-center">
            <p className="text-green-700 dark:text-green-400 font-bold text-lg">{translations.playerWon}</p>
          </div>
        )}
        {gameState.gameStatus === 'dealer-won' && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 rounded-lg text-center">
            <p className="text-red-700 dark:text-red-400 font-bold text-lg">{translations.dealerWon}</p>
          </div>
        )}
        {gameState.gameStatus === 'tie' && (
          <div className="mb-6 p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-center">
            <p className="text-yellow-700 dark:text-yellow-400 font-bold text-lg">{translations.tie}</p>
          </div>
        )}

        {/* Controls */}
        {gameState.gameStatus === 'playing' && !gameState.playerHand.isBusted && gameState.playerHand.total !== 21 && (
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleHit}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg cursor-pointer"
            >
              {translations.hit}
            </button>
            <button
              onClick={handleStand}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg cursor-pointer"
            >
              {translations.stand}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

