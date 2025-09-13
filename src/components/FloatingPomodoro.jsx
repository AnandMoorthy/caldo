import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Clock, Play, Pause, Square, X, Grip, Settings } from "lucide-react";
import { parseISO, isAfter, startOfDay, isBefore, endOfDay } from "date-fns";

const POMODORO_PHASES = {
  WORK: 'work',
  SHORT_BREAK: 'shortBreak',
  LONG_BREAK: 'longBreak'
};

const DEFAULT_TIMES = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60
};

export default function FloatingPomodoro({ 
  isVisible, 
  onClose, 
  currentTask = null,
  onTaskComplete = null,
  onRunningStateChange = null
}) {
  const [phase, setPhase] = useState(POMODORO_PHASES.WORK);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIMES.work);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [customTimes, setCustomTimes] = useState(DEFAULT_TIMES);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(customTimes);
  
  // Check if Pomodoro should be disabled based on task date
  const isPomodoroDisabled = () => {
    if (!currentTask) return false;
    
    const taskDate = currentTask.due || currentTask.dateKey;
    if (!taskDate) return false;
    
    const today = new Date();
    const taskDateObj = parseISO(taskDate);
    
    // Disable if task is for past or future dates (only allow today)
    return isBefore(taskDateObj, startOfDay(today)) || isAfter(taskDateObj, endOfDay(today));
  };
  
  const intervalRef = useRef(null);
  const widgetRef = useRef(null);

  // Load settings
  useEffect(() => {
    const saved = localStorage.getItem('pomodoro_settings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        setCustomTimes(prev => ({ ...prev, ...settings.times }));
        setTimeLeft(settings.times[phase] || DEFAULT_TIMES[phase]);
      } catch (e) {
        console.warn('Failed to load Pomodoro settings');
      }
    }
  }, [phase]);

  // Load position from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('pomodoro_position');
    if (saved) {
      try {
        const pos = JSON.parse(saved);
        setPosition(pos);
      } catch (e) {
        // Default position above task list
        setPosition({ x: 20, y: 100 });
      }
    } else {
      // Default position above task list
      setPosition({ x: 20, y: 100 });
    }
  }, []);

  // Reset timer when task changes
  useEffect(() => {
    if (currentTask && currentTask.id !== currentTaskId) {
      setCurrentTaskId(currentTask.id);
      // Reset timer state for new task
      setIsRunning(false);
      setPhase(POMODORO_PHASES.WORK);
      setTimeLeft(customTimes.work);
      setSessionsCompleted(0);
    }
  }, [currentTask, currentTaskId, customTimes.work]);

  // Notify parent component when running state changes
  useEffect(() => {
    if (onRunningStateChange) {
      onRunningStateChange({
        isRunning,
        currentTask: isRunning ? currentTask : null,
        timeLeft: isRunning ? timeLeft : null,
        phase: isRunning ? phase : null,
        totalTime: isRunning ? customTimes[phase] : null
      });
    }
  }, [isRunning, currentTask, timeLeft, phase, customTimes, onRunningStateChange]);

  // Save position to localStorage
  const savePosition = (newPosition) => {
    localStorage.setItem('pomodoro_position', JSON.stringify(newPosition));
  };

  // Save settings to localStorage
  const saveSettings = (newTimes) => {
    const settings = { times: newTimes };
    localStorage.setItem('pomodoro_settings', JSON.stringify(settings));
    setCustomTimes(newTimes);
    setSettings(newTimes);
    // Update current timer if it's not running
    if (!isRunning) {
      setTimeLeft(newTimes[phase]);
    }
  };

  const updateSetting = (phase, minutes) => {
    const newSettings = {
      ...settings,
      [phase]: Math.max(1, minutes) * 60
    };
    setSettings(newSettings);
  };

  const handleSaveSettings = () => {
    saveSettings(settings);
    setShowSettings(false);
  };

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

  const playNotificationSound = () => {
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
  };

  const showNotification = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icons/icon-192.png' });
    }
    // Play sound notification
    playNotificationSound();
  };

  const getNotificationMessage = (phase) => {
    const workMinutes = Math.floor(customTimes.work / 60);
    const shortBreakMinutes = Math.floor(customTimes.shortBreak / 60);
    const longBreakMinutes = Math.floor(customTimes.longBreak / 60);
    
    switch (phase) {
      case POMODORO_PHASES.WORK:
        return `Work Time! Focus for ${workMinutes} minutes.`;
      case POMODORO_PHASES.SHORT_BREAK:
        return `Break Time! Take a ${shortBreakMinutes}-minute break.`;
      case POMODORO_PHASES.LONG_BREAK:
        return `Long Break Time! Take a ${longBreakMinutes}-minute break. You've completed 4 Pomodoros!`;
      default:
        return 'Work Time!';
    }
  };

  const handlePhaseComplete = () => {
    setIsRunning(false);
    
    if (phase === POMODORO_PHASES.WORK) {
      const newSessions = sessionsCompleted + 1;
      setSessionsCompleted(newSessions);
      
      if (newSessions % 4 === 0) {
        setPhase(POMODORO_PHASES.LONG_BREAK);
        setTimeLeft(customTimes.longBreak);
        showNotification('Long Break Time!', getNotificationMessage(POMODORO_PHASES.LONG_BREAK));
      } else {
        setPhase(POMODORO_PHASES.SHORT_BREAK);
        setTimeLeft(customTimes.shortBreak);
        showNotification('Break Time!', getNotificationMessage(POMODORO_PHASES.SHORT_BREAK));
      }
      
      // Mark current task as completed if provided
      if (currentTask && onTaskComplete) {
        onTaskComplete(currentTask);
      }
    } else {
      setPhase(POMODORO_PHASES.WORK);
      setTimeLeft(customTimes.work);
      showNotification('Work Time!', getNotificationMessage(POMODORO_PHASES.WORK));
    }
  };

  const startTimer = () => {
    if (isPomodoroDisabled()) return;
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(customTimes[phase]);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseColor = () => {
    switch (phase) {
      case POMODORO_PHASES.WORK:
        return 'text-red-600 dark:text-red-400';
      case POMODORO_PHASES.SHORT_BREAK:
        return 'text-green-600 dark:text-green-400';
      case POMODORO_PHASES.LONG_BREAK:
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-red-600 dark:text-red-400';
    }
  };

  const getPhaseLabel = () => {
    switch (phase) {
      case POMODORO_PHASES.WORK:
        return 'Focus';
      case POMODORO_PHASES.SHORT_BREAK:
        return 'Break';
      case POMODORO_PHASES.LONG_BREAK:
        return 'Long Break';
      default:
        return 'Focus';
    }
  };

  const getPhaseBgColor = () => {
    switch (phase) {
      case POMODORO_PHASES.WORK:
        return 'border-red-200 dark:border-red-800';
      case POMODORO_PHASES.SHORT_BREAK:
        return 'border-green-200 dark:border-green-800';
      case POMODORO_PHASES.LONG_BREAK:
        return 'border-blue-200 dark:border-blue-800';
      default:
        return 'border-red-200 dark:border-red-800';
    }
  };

  // Drag handling
  const handleMouseDown = (e) => {
    if (e.target.closest('button')) return; // Don't drag when clicking buttons
    
    setIsDragging(true);
    const rect = widgetRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newPosition = {
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    };
    
    // Keep widget within viewport
    const maxX = window.innerWidth - 200;
    const maxY = window.innerHeight - 100;
    
    newPosition.x = Math.max(0, Math.min(newPosition.x, maxX));
    newPosition.y = Math.max(0, Math.min(newPosition.y, maxY));
    
    setPosition(newPosition);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      savePosition(position);
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  if (!isVisible) return null;

  return (
    <motion.div
      ref={widgetRef}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 1000
      }}
      className={`w-72 border-2 rounded-lg shadow-lg bg-white dark:bg-slate-900 cursor-move select-none ${getPhaseBgColor()}`}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Clock size={14} className={getPhaseColor()} />
          <span className={`text-xs font-medium ${getPhaseColor()}`}>
            {getPhaseLabel()}
          </span>
          {isPomodoroDisabled() && (
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              (Today only)
            </span>
          )}
          {currentTask && (
            <>
              <span className="text-xs text-slate-400 dark:text-slate-500">•</span>
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                {currentTask.title}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            aria-label="Settings"
          >
            <Settings size={12} className="text-slate-600 dark:text-slate-400" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            aria-label="Close"
          >
            <X size={12} className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>

      {/* Main Content - Horizontal Layout */}
      <div className="flex items-center justify-between p-3">
        {/* Timer Display */}
        <div className="flex-1 text-center">
          <div className={`text-2xl font-mono font-bold ${getPhaseColor()} mb-1`}>
            {formatTime(timeLeft)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {sessionsCompleted} sessions
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          {!isRunning ? (
            <button
              onClick={startTimer}
              disabled={isPomodoroDisabled()}
              className={`flex items-center gap-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                isPomodoroDisabled()
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200'
              }`}
            >
              <Play size={14} />
              Start
            </button>
          ) : (
            <button
              onClick={pauseTimer}
              className="flex items-center gap-1 px-3 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
            >
              <Pause size={14} />
              Pause
            </button>
          )}
          
          <button
            onClick={resetTimer}
            className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="Reset"
          >
            <Square size={14} />
          </button>
        </div>
      </div>

      {/* Inline Settings */}
      {showSettings && (
        <div className="border-t border-slate-200 dark:border-slate-700 p-3 space-y-2">
          <h4 className="text-xs font-medium text-slate-900 dark:text-slate-100">Timer Settings</h4>
          
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Work (min)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={Math.floor(settings.work / 60)}
                onChange={(e) => updateSetting('work', parseInt(e.target.value) || 1)}
                className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Short (min)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={Math.floor(settings.shortBreak / 60)}
                onChange={(e) => updateSetting('shortBreak', parseInt(e.target.value) || 1)}
                className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Long (min)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={Math.floor(settings.longBreak / 60)}
                onChange={(e) => updateSetting('longBreak', parseInt(e.target.value) || 1)}
                className="w-full px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
          
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setShowSettings(false)}
              className="flex-1 px-2 py-1 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSettings}
              className="flex-1 px-2 py-1 text-xs bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

