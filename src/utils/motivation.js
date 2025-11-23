/**
 * Motivational messages for incomplete tasks
 * Mix of supportive and aggressive messages to keep users accountable
 */

const motivationalMessages = [
  // Famous quotes - Inspirational
  "The way to get started is to quit talking and begin doing. - Walt Disney",
  "It does not matter how slowly you go as long as you do not stop. - Confucius",
  "The future depends on what you do today. - Mahatma Gandhi",
  "You don't have to be great to start, but you have to start to be great. - Zig Ziglar",
  "The only way to do great work is to love what you do. - Steve Jobs",
  "Success is the sum of small efforts repeated day in and day out. - Robert Collier",
  "The best time to plant a tree was 20 years ago. The second best time is now. - Chinese Proverb",
  "Don't watch the clock; do what it does. Keep going. - Sam Levenson",
  "The way to get started is to quit talking and begin doing. - Walt Disney",
  "In the middle of difficulty lies opportunity. - Albert Einstein",
  "Life is what happens to you while you're busy making other plans. - John Lennon",
  "The only impossible journey is the one you never begin. - Tony Robbins",
  "It always seems impossible until it's done. - Nelson Mandela",
  "The secret of getting ahead is getting started. - Mark Twain",
  "You miss 100% of the shots you don't take. - Wayne Gretzky",
  "The harder I work, the luckier I get. - Gary Player",
  "Genius is 1% inspiration and 99% perspiration. - Thomas Edison",
  "I have not failed. I've just found 10,000 ways that won't work. - Thomas Edison",
  "The only person you are destined to become is the person you decide to be. - Ralph Waldo Emerson",
  "Whether you think you can or you think you can't, you're right. - Henry Ford",
  "The two most important days in your life are the day you are born and the day you find out why. - Mark Twain",
  "If you want to lift yourself up, lift up someone else. - Booker T. Washington",
  "The person who says it cannot be done should not interrupt the person who is doing it. - Chinese Proverb",
  "Twenty years from now you will be more disappointed by the things that you didn't do than by the ones you did do. - Mark Twain",
  "Innovation distinguishes between a leader and a follower. - Steve Jobs",
  "The only limit to our realization of tomorrow will be our doubts of today. - Franklin D. Roosevelt",
  "The way to get started is to quit talking and begin doing. - Walt Disney",
  "You can't use up creativity. The more you use, the more you have. - Maya Angelou",
  "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
  "It is during our darkest moments that we must focus to see the light. - Aristotle",
  "The only way to do great work is to love what you do. - Steve Jobs",
  "If you are working on something exciting that you really care about, you don't have to be pushed. The vision pulls you. - Steve Jobs",
  "People who are crazy enough to think they can change the world, are the ones who do. - Rob Siltanen",
  "The greatest glory in living lies not in never falling, but in rising every time we fall. - Nelson Mandela",
  "Your limitation—it's only your imagination.",
  "Push yourself, because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "Dream it. Wish it. Do it.",
  "Success doesn't just find you. You have to go out and get it.",
  "The harder you work for something, the greater you'll feel when you achieve it.",
  "Dream bigger. Do bigger.",
  "Don't stop when you're tired. Stop when you're done.",
  "Wake up with determination. Go to bed with satisfaction.",
  "Do something today that your future self will thank you for.",
  "Little things make big things happen.",
  "Don't wait for opportunity. Create it.",
  "Sometimes we're tested not to show our weaknesses, but to discover our strengths.",
  "The key to success is to focus on goals, not obstacles.",
  "Dream it. Believe it. Build it.",
  
  // Direct/Accountability messages
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

