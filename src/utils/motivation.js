/**
 * Motivational messages for incomplete tasks
 * Mix of supportive and aggressive messages to keep users accountable
 */

const motivationalMessages = [
  // Supportive messages
  "You've got this! Finish what you started.",
  "One task at a time. You can do it!",
  "Progress, not perfection. Let's complete these tasks.",
  "Your future self will thank you. Get it done!",
  "Small steps lead to big wins. Start now!",
  "You're capable of more than you think. Let's finish these!",
  
  // More direct/aggressive messages
  "These tasks aren't going to complete themselves. Time to act!",
  "Stop procrastinating. Your tasks are waiting.",
  "Excuses won't complete your tasks. Action will.",
  "The clock is ticking. Get these done!",
  "You set these goals for a reason. Follow through!",
  "No more delays. Time to execute!",
  "Your tasks are piling up. Time to take control!",
  "Stop making excuses. Start making progress!",
  "The only way to get ahead is to get started. Now!",
  "You're better than this. Finish what you started!",
  "These incomplete tasks are a reflection of your commitment. Show up!",
  "The time for planning is over. The time for doing is now!",
  "Your goals don't work unless you do. Let's go!",
  "Stop waiting for the perfect moment. This is it!",
];

/**
 * Get a random motivational message
 * Returns a different message each time (random selection)
 */
export function getMotivationalMessage() {
  const index = Math.floor(Math.random() * motivationalMessages.length);
  return motivationalMessages[index];
}

/**
 * Get a motivational message based on number of incomplete tasks
 */
export function getMotivationalMessageForCount(incompleteCount) {
  const baseMessage = getMotivationalMessage();
  
  if (incompleteCount === 1) {
    return baseMessage;
  } else if (incompleteCount <= 3) {
    return `${incompleteCount} tasks waiting. ${baseMessage}`;
  } else {
    return `${incompleteCount} incomplete tasks. ${baseMessage}`;
  }
}

