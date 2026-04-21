import { Flashcard, FlashcardConfig, ReviewEntry } from '../types';

/**
 * SM-2 Plus Algorithm Implementation
 * Enhanced SuperMemo algorithm with proper learning, review, and relearning states
 */

export const sm2plus = {
  /**
   * Process a card review and return updated card
   */
  processReview: (
    card: Flashcard,
    rating: 'again' | 'hard' | 'good' | 'easy',
    config: FlashcardConfig
  ): Flashcard => {
    let { interval, ease_factor, repetitions, status } = card;
    const history = card.review_history || [];

    let newStatus = status;
    let nextReview = new Date();
    let newInterval = interval;
    let newEase = ease_factor;
    let newReps = repetitions;

    // SM-2 Plus logic
    switch (rating) {
      case 'again':
        // Card failed - go back to learning or relearning
        newStatus = status === 'new' ? 'learning' : 'relearning';
        newInterval = 0;
        newEase = Math.max(config.min_ease, ease_factor - 0.2);
        newReps = 0;
        
        // Schedule next review with relearning steps
        const relearningMinutes = config.relearning_steps[0] || 10;
        nextReview = new Date(Date.now() + relearningMinutes * 60 * 1000);
        break;

      case 'hard':
        if (status === 'new' || status === 'learning') {
          // Still in learning phase
          newStatus = 'learning';
          newInterval = 0;
          const learningMinutes = config.learning_steps[0] || 1;
          nextReview = new Date(Date.now() + learningMinutes * 60 * 1000);
        } else if (status === 'relearning') {
          // In relearning, stay there
          newStatus = 'relearning';
          newInterval = 0;
          const relearningMinutes = config.relearning_steps[0] || 10;
          nextReview = new Date(Date.now() + relearningMinutes * 60 * 1000);
        } else {
          // Review card - increase interval by 1.2x
          newStatus = 'review';
          newInterval = Math.max(1, Math.ceil((interval || 1) * 1.2));
          nextReview = new Date();
          nextReview.setDate(nextReview.getDate() + newInterval);
          newReps++;
        }
        newEase = Math.max(config.min_ease, ease_factor - 0.15);
        break;

      case 'good':
        if (status === 'new') {
          // New card → Learning with first step
          newStatus = 'learning';
          newInterval = config.learning_steps[0] || 1;
          nextReview = new Date(Date.now() + newInterval * 60 * 1000);
        } else if (status === 'learning') {
          // Check if completed learning steps
          const completedGood = history.filter(h => h.rating === 'good').length;
          if (completedGood < config.learning_steps.length - 1) {
            // Next learning step
            newStatus = 'learning';
            newInterval = config.learning_steps[completedGood + 1] || 1440;
            nextReview = new Date(Date.now() + newInterval * 60 * 1000);
          } else {
            // Graduated to review
            newStatus = 'review';
            newInterval = 1;
            nextReview = new Date();
            nextReview.setDate(nextReview.getDate() + 1);
            newReps = 1;
          }
        } else if (status === 'relearning') {
          // Graduated from relearning
          newStatus = 'review';
          newInterval = 1;
          nextReview = new Date();
          nextReview.setDate(nextReview.getDate() + 1);
          newReps++;
        } else {
          // Review card - apply ease_factor
          newStatus = 'review';
          newInterval = Math.ceil((interval || 1) * (ease_factor || 2.5));
          nextReview = new Date();
          nextReview.setDate(nextReview.getDate() + newInterval);
          newReps++;
        }
        break;

      case 'easy':
        if (status === 'new' || status === 'learning') {
          // Easy answer during learning → directly to review
          newStatus = 'review';
          newInterval = Math.max(4, Math.min(config.learning_steps[config.learning_steps.length - 1] || 10));
        } else if (status === 'relearning') {
          // Easy during relearning → review with base interval
          newStatus = 'review';
          newInterval = 4;
        } else {
          // Review card - large interval boost
          newInterval = Math.ceil((interval || 1) * (ease_factor || 2.5) * 1.3);
        }
        
        newEase = Math.min(config.max_ease, ease_factor + 0.15);
        newInterval = Math.min(newInterval, config.max_interval);
        nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + newInterval);
        newReps++;
        break;
    }

    // Apply interval modifier
    if (newInterval > 0) {
      newInterval = Math.max(1, Math.ceil(newInterval * config.interval_modifier));
    }

    // Record review entry
    const entry: ReviewEntry = {
      date: new Date().toISOString(),
      rating,
      interval: newInterval,
      ease_factor: newEase,
    };

    return {
      ...card,
      interval: newInterval,
      ease_factor: parseFloat(newEase.toFixed(2)),
      repetitions: newReps,
      status: newStatus,
      next_review: nextReview.toISOString(),
      last_review: new Date().toISOString(),
      review_history: [...history, entry],
    };
  },

  /**
   * Get cards due for review
   */
  getDueCards: (cards: Flashcard[], limit?: number): Flashcard[] => {
    const now = new Date();
    const due = cards.filter(c => new Date(c.next_review) <= now);
    
    if (limit && due.length > limit) {
      return due.slice(0, limit);
    }
    
    return due;
  },

  /**
   * Get new cards
   */
  getNewCards: (cards: Flashcard[], limit?: number): Flashcard[] => {
    const newCards = cards.filter(c => c.status === 'new');
    
    if (limit && newCards.length > limit) {
      return newCards.slice(0, limit);
    }
    
    return newCards;
  },

  /**
   * Calculate statistics for cards
   */
  getStats: (cards: Flashcard[]) => {
    const newCount = cards.filter(c => c.status === 'new').length;
    const learningCount = cards.filter(c => c.status === 'learning').length;
    const reviewCount = cards.filter(c => c.status === 'review').length;
    const relearningCount = cards.filter(c => c.status === 'relearning').length;
    const masteredCount = cards.filter(c => c.status === 'mastered').length;

    const now = new Date();
    const dueCount = cards.filter(c => new Date(c.next_review) <= now).length;

    const avgEase = cards.length > 0
      ? (cards.reduce((sum, c) => sum + c.ease_factor, 0) / cards.length)
      : 2.5;

    const avgInterval = cards.filter(c => c.interval > 0).length > 0
      ? (cards.reduce((sum, c) => sum + (c.interval || 0), 0) / cards.filter(c => c.interval > 0).length)
      : 0;

    return {
      total: cards.length,
      newCount,
      learningCount,
      reviewCount,
      relearningCount,
      masteredCount,
      dueCount,
      avgEase: parseFloat(avgEase.toFixed(2)),
      avgInterval: parseFloat(avgInterval.toFixed(1)),
    };
  },

  /**
   * Reset card progress
   */
  reset: (card: Flashcard): Flashcard => {
    return {
      ...card,
      status: 'new',
      interval: 0,
      ease_factor: 2.5,
      repetitions: 0,
      next_review: new Date().toISOString(),
      review_history: [],
      last_review: undefined,
    };
  },
};
