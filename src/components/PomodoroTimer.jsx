import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Square, RotateCcw, Settings, X, Clock, Coffee, CheckCircle } from "lucide-react";

const POMODORO_PHASES = {
  WORK: 'work',
  SHORT_BREAK: 'shortBreak',
  LONG_BREAK: 'longBreak'
};

const DEFAULT_TIMES = {
  work: 25 * 60, // 25 minutes
  shortBreak: 5 * 60, // 5 minutes
  longBreak: 15 * 60 // 15 minutes
};

export default function PomodoroTimer({ 
  isOpen, 
  onClose, 
  currentTask = null,
  onTaskComplete = null 
}) {
  const [phase, setPhase] = useState(POMODORO_PHASES.WORK);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIMES.work);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [customTimes, setCustomTimes] = useState(DEFAULT_TIMES);
  
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pomodoro_settings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        setCustomTimes(prev => ({ ...prev, ...settings.times }));
      } catch (e) {
        console.warn('Failed to load Pomodoro settings');
      }
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = useCallback((newTimes) => {
    const settings = { times: newTimes };
    localStorage.setItem('pomodoro_settings', JSON.stringify(settings));
    setCustomTimes(newTimes);
  }, []);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handlePhaseComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  // Browser notifications
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const playNotificationSound = useCallback(() => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }, []);

  const showNotification = useCallback((title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icons/icon-192.png' });
    }
    // Play sound notification
    playNotificationSound();
  }, [playNotificationSound]);

  const handlePhaseComplete = useCallback(() => {
    setIsRunning(false);
    
    if (phase === POMODORO_PHASES.WORK) {
      const newSessions = sessionsCompleted + 1;
      setSessionsCompleted(newSessions);
      
      // Check if it's time for a long break (every 4 sessions)
      if (newSessions % 4 === 0) {
        setPhase(POMODORO_PHASES.LONG_BREAK);
        setTimeLeft(customTimes.longBreak);
        showNotification('Long Break Time!', 'Take a 15-minute break. You\'ve completed 4 Pomodoros!');
      } else {
        setPhase(POMODORO_PHASES.SHORT_BREAK);
        setTimeLeft(customTimes.shortBreak);
        showNotification('Break Time!', 'Take a 5-minute break.');
      }
      
      // Mark current task as completed if provided
      if (currentTask && onTaskComplete) {
        onTaskComplete(currentTask);
      }
    } else {
      // Break is over, start work phase
      setPhase(POMODORO_PHASES.WORK);
      setTimeLeft(customTimes.work);
      showNotification('Work Time!', 'Break is over. Time to focus!');
    }
  }, [phase, sessionsCompleted, customTimes, currentTask, onTaskComplete, showNotification]);

  const startTimer = () => {
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(customTimes[phase]);
  };

  const skipPhase = () => {
    handlePhaseComplete();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseInfo = () => {
    switch (phase) {
      case POMODORO_PHASES.WORK:
        return { 
          title: 'Focus Time', 
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          icon: Clock
        };
      case POMODORO_PHASES.SHORT_BREAK:
        return { 
          title: 'Short Break', 
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          icon: Coffee
        };
      case POMODORO_PHASES.LONG_BREAK:
        return { 
          title: 'Long Break', 
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          icon: Coffee
        };
      default:
        return { 
          title: 'Focus Time', 
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          icon: Clock
        };
    }
  };

  const phaseInfo = getPhaseInfo();
  const Icon = phaseInfo.icon;
  const progress = ((customTimes[phase] - timeLeft) / customTimes[phase]) * 100;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className={`relative w-full max-w-md ${phaseInfo.bgColor} ${phaseInfo.borderColor} border-2 rounded-2xl shadow-2xl bg-white dark:bg-slate-900`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Icon size={20} className={phaseInfo.color} />
              <h2 className={`font-semibold ${phaseInfo.color}`}>{phaseInfo.title}</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Settings"
              >
                <Settings size={16} className="text-slate-600 dark:text-slate-400" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X size={16} className="text-slate-600 dark:text-slate-400" />
              </button>
            </div>
          </div>

          {/* Timer Display */}
          <div className="p-6 text-center">
            {/* Progress Circle */}
            <div className="relative w-48 h-48 mx-auto mb-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="text-slate-200 dark:text-slate-700"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                  className={phaseInfo.color}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${phaseInfo.color}`}>
                    {formatTime(timeLeft)}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Sessions: {sessionsCompleted}
                  </div>
                </div>
              </div>
            </div>

            {/* Current Task */}
            {currentTask && (
              <div className="mb-4 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Working on:</div>
                <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                  {currentTask.title}
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              {!isRunning ? (
                <button
                  onClick={startTimer}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                >
                  <Play size={18} />
                  Start
                </button>
              ) : (
                <button
                  onClick={pauseTimer}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
                >
                  <Pause size={18} />
                  Pause
                </button>
              )}
              
              <button
                onClick={resetTimer}
                className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                aria-label="Reset"
              >
                <RotateCcw size={18} />
              </button>
              
              <button
                onClick={skipPhase}
                className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                aria-label="Skip"
              >
                <Square size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <PomodoroSettings
            customTimes={customTimes}
            onSave={saveSettings}
            onClose={() => setShowSettings(false)}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Settings Component
function PomodoroSettings({ customTimes, onSave, onClose }) {
  const [times, setTimes] = useState(customTimes);

  const handleSave = () => {
    onSave(times);
    onClose();
  };

  const updateTime = (phase, minutes) => {
    setTimes(prev => ({
      ...prev,
      [phase]: Math.max(1, minutes) * 60
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/50 flex items-center justify-center p-4"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Pomodoro Settings</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={16} className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Work Duration (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={times.work / 60}
              onChange={(e) => updateTime('work', parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Short Break (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={times.shortBreak / 60}
              onChange={(e) => updateTime('shortBreak', parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Long Break (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={times.longBreak / 60}
              onChange={(e) => updateTime('longBreak', parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
        
        <div className="flex gap-3 p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </motion.div>
  );
}
