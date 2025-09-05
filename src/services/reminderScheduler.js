/**
 * Reminder scheduler service for task notifications
 * Calculates notification times (10 minutes before task time) and schedules them
 */

import { notificationService } from './notificationService.js';

class ReminderScheduler {
  constructor() {
    this.scheduledReminders = new Map(); // taskId -> timeoutId
    this.isRunning = false;
    this.updateTimeout = null; // For debouncing updates
    this.lastTasksMap = null; // Track last processed tasksMap
  }

  /**
   * Parse time string (HH:MM) and return hours and minutes
   * @param {string} timeStr - Time in format "HH:MM" or "H:MM"
   * @returns {Object} { hours, minutes }
   */
  parseTime(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') {
      throw new Error('Invalid time string');
    }

    const [hours, minutes] = timeStr.split(':').map(Number);
    
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new Error('Invalid time format. Expected HH:MM');
    }

    return { hours, minutes };
  }

  /**
   * Calculate notification time (10 minutes before task time)
   * @param {string} dateKey - Date in YYYY-MM-DD format
   * @param {string} reminderTime - Time in HH:MM format
   * @returns {Date} Notification time
   */
  calculateNotificationTime(dateKey, reminderTime) {
    const { hours, minutes } = this.parseTime(reminderTime);
    
    // Create date object for the task date
    const taskDate = new Date(dateKey + 'T00:00:00');
    const taskDateTime = new Date(taskDate);
    taskDateTime.setHours(hours, minutes, 0, 0);

    // Calculate notification time (10 minutes before)
    const notificationTime = new Date(taskDateTime);
    notificationTime.setMinutes(notificationTime.getMinutes() - 10);

    return notificationTime;
  }

  /**
   * Check if a notification should be scheduled (not in the past)
   * @param {Date} notificationTime - When to show the notification
   * @returns {boolean}
   */
  shouldScheduleNotification(notificationTime) {
    const now = new Date();
    return notificationTime > now;
  }

  /**
   * Schedule a reminder notification for a task
   * @param {Object} task - Task object
   * @param {string} task.id - Task ID
   * @param {string} task.title - Task title
   * @param {string} task.dateKey - Date in YYYY-MM-DD format (or task.due)
   * @param {string} task.reminderTime - Time in HH:MM format
   */
  scheduleReminder(task) {
    // Validate task first
    if (!this.isValidTask(task)) {
      console.warn('Cannot schedule reminder: invalid task', task);
      return;
    }

    // Use dateKey if available, otherwise fall back to due
    const dateKey = task.dateKey || task.due;
    if (!dateKey) {
      console.warn('Cannot schedule reminder: missing dateKey or due', task);
      return;
    }

    // Cancel existing reminder for this task
    this.cancelReminder(task.id);

    try {
      const notificationTime = this.calculateNotificationTime(dateKey, task.reminderTime);
      
      if (!this.shouldScheduleNotification(notificationTime)) {
        console.log('Notification time is in the past, skipping:', task.title);
        return;
      }

      const delay = notificationTime.getTime() - Date.now();
      
      // Additional validation: ensure delay is reasonable (not too far in the past or future)
      if (delay < 0) {
        console.log('Notification time is in the past, skipping:', task.title);
        return;
      }
      
      if (delay > 24 * 60 * 60 * 1000) { // More than 24 hours
        console.log('Notification time is too far in the future, skipping:', task.title);
        return;
      }
      
      const timeoutId = setTimeout(async () => {
        try {
          // Double-check the task is still valid before showing notification
          if (!this.isValidTask(task)) {
            console.warn('Task became invalid before notification, skipping:', task.title);
            return;
          }
          
          await notificationService.showReminderNotification(task);
          console.log('🔔 Reminder sent:', task.title);
        } catch (error) {
          console.error('Error showing reminder notification:', error);
        } finally {
          // Remove from scheduled reminders after execution
          this.scheduledReminders.delete(task.id);
        }
      }, delay);

      this.scheduledReminders.set(task.id, timeoutId);
      
    } catch (error) {
      console.error('Error scheduling reminder for task:', task, error);
    }
  }

  /**
   * Cancel a scheduled reminder
   * @param {string} taskId - Task ID
   */
  cancelReminder(taskId) {
    const timeoutId = this.scheduledReminders.get(taskId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.scheduledReminders.delete(taskId);
      console.log('Cancelled reminder for task:', taskId);
    }
  }

  /**
   * Schedule reminders for multiple tasks
   * @param {Array} tasks - Array of task objects
   */
  scheduleReminders(tasks) {
    if (!Array.isArray(tasks)) {
      console.warn('scheduleReminders expects an array of tasks');
      return;
    }

    tasks.forEach(task => {
      if (task.reminderTime && !task.done) {
        this.scheduleReminder(task);
      }
    });
  }

  /**
   * Cancel all scheduled reminders
   */
  cancelAllReminders() {
    const count = this.scheduledReminders.size;
    this.scheduledReminders.forEach((timeoutId, taskId) => {
      clearTimeout(timeoutId);
    });
    this.scheduledReminders.clear();
    if (count > 0) {
      console.log(`Cancelled ${count} scheduled reminders`);
    }
  }

  /**
   * Clean up resources and cancel all reminders
   */
  cleanup() {
    this.cancelAllReminders();
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
      this.updateTimeout = null;
    }
    this.lastTasksMap = null;
    console.log('Reminder scheduler cleaned up');
  }

  /**
   * Get count of scheduled reminders
   * @returns {number}
   */
  getScheduledCount() {
    return this.scheduledReminders.size;
  }

  /**
   * Get list of scheduled task IDs
   * @returns {Array<string>}
   */
  getScheduledTaskIds() {
    return Array.from(this.scheduledReminders.keys());
  }

  /**
   * Get debug information about scheduled reminders
   * @returns {Object} Debug info
   */
  getDebugInfo() {
    return {
      scheduledCount: this.scheduledReminders.size,
      scheduledTaskIds: Array.from(this.scheduledReminders.keys()),
      hasUpdateTimeout: !!this.updateTimeout,
      lastTasksMap: this.lastTasksMap ? 'present' : 'null',
      today: new Date().toISOString().split('T')[0]
    };
  }

  /**
   * Force refresh reminders for today only
   * Useful when the date changes or for debugging
   */
  refreshTodayReminders() {
    console.log('🔄 Refreshing reminders...');
    if (this.lastTasksMap) {
      this._performUpdate(this.lastTasksMap);
    } else {
      console.warn('No tasksMap available for refresh');
    }
  }

  /**
   * Force trigger the debounced update immediately
   * Useful for debugging
   */
  forceUpdate() {
    console.log('⚡ Force updating reminders...');
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
      this.updateTimeout = null;
    }
    if (this.lastTasksMap) {
      this._performUpdate(this.lastTasksMap);
    } else {
      console.warn('No tasksMap available for force update');
    }
  }

  /**
   * Validate task object before scheduling
   * @param {Object} task - Task object to validate
   * @returns {boolean} true if valid
   */
  isValidTask(task) {
    return task && 
           typeof task === 'object' && 
           task.id && 
           typeof task.id === 'string' && 
           task.title && 
           typeof task.title === 'string' &&
           task.reminderTime &&
           typeof task.reminderTime === 'string' &&
           !task.done;
  }

  /**
   * Debounced update reminders when tasks change
   * @param {Object} tasksMap - Map of dateKey -> tasks array
   */
  updateReminders(tasksMap) {
    // Clear existing timeout
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }

    // Debounce updates by 100ms to prevent excessive rescheduling
    this.updateTimeout = setTimeout(() => {
      this._performUpdate(tasksMap);
    }, 100);
  }

  /**
   * Internal method to perform the actual update
   * @param {Object} tasksMap - Map of dateKey -> tasks array
   */
  _performUpdate(tasksMap) {
    // Check if tasksMap actually changed
    if (this.lastTasksMap === tasksMap) {
      return;
    }
    this.lastTasksMap = tasksMap;

    // Cancel all existing reminders
    this.cancelAllReminders();

    // Only schedule reminders for today's tasks
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Schedule new reminders for today's tasks only
    if (tasksMap && typeof tasksMap === 'object') {
      let totalTasks = 0;
      let tasksWithReminders = 0;
      let invalidTasks = 0;
      let skippedTasks = 0;
      
      Object.entries(tasksMap).forEach(([dateKey, dayTasks]) => {
        if (Array.isArray(dayTasks)) {
          dayTasks.forEach(task => {
            totalTasks++;
            
            // Only process tasks for today
            const taskDate = task.dateKey || task.due;
            if (taskDate !== today) {
              if (task.reminderTime) {
                skippedTasks++;
                console.log(`⏭️ Skipping "${task.title}" - not today (${taskDate})`);
              }
              return;
            }
            
            // Validate task before processing
            if (!this.isValidTask(task)) {
              if (task.reminderTime) {
                invalidTasks++;
                console.warn('❌ Invalid task:', task.title, task);
              }
              return;
            }

            tasksWithReminders++;
            console.log('✅ Scheduling reminder for:', task.title, 'at', task.reminderTime);
            this.scheduleReminder(task);
          });
        }
      });
      
      // Only log if there are tasks with reminders or issues
      if (tasksWithReminders > 0 || invalidTasks > 0 || skippedTasks > 0) {
        console.log(`📊 Reminders: ${tasksWithReminders} scheduled, ${invalidTasks} invalid, ${skippedTasks} skipped`);
      }
    }
  }

  /**
   * Test function to schedule a reminder in 5 seconds for testing
   * @param {string} title - Task title for test
   */
  testReminder(title = 'Test Reminder') {
    const testTask = {
      id: 'test-' + Date.now(),
      title,
      reminderTime: '00:00', // Will be calculated as 10 minutes before midnight
      dateKey: new Date().toISOString().split('T')[0], // Today
    };
    
    // Override the notification time to be 5 seconds from now
    const notificationTime = new Date(Date.now() + 5000);
    const delay = 5000;
    
    console.log(`Scheduling test reminder for "${title}" in 5 seconds`);
    
    const timeoutId = setTimeout(async () => {
      try {
        await notificationService.showReminderNotification(testTask);
        console.log('Test reminder notification sent for:', testTask.title);
      } catch (error) {
        console.error('Error showing test reminder notification:', error);
      }
    }, delay);

    this.scheduledReminders.set(testTask.id, timeoutId);
  }
}

// Export singleton instance
export const reminderScheduler = new ReminderScheduler();
export default reminderScheduler;
