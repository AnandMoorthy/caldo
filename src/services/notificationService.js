/**
 * Browser notification service for task reminders
 */

class NotificationService {
  constructor() {
    this.permission = 'default';
    this.isSupported = 'Notification' in window;
    this.checkPermission();
  }

  /**
   * Check current notification permission status
   */
  checkPermission() {
    if (!this.isSupported) {
      this.permission = 'unsupported';
      return;
    }
    this.permission = Notification.permission;
  }

  /**
   * Request notification permission from user
   * @returns {Promise<boolean>} true if permission granted
   */
  async requestPermission() {
    if (!this.isSupported) {
      console.warn('Notifications not supported in this browser');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    if (this.permission === 'denied') {
      console.warn('Notification permission denied by user');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Show a notification for a task reminder
   * @param {Object} task - Task object with title and reminderTime
   * @param {string} task.title - Task title
   * @param {string} task.reminderTime - Time in HH:MM format
   */
  async showReminderNotification(task) {
    console.log('Attempting to show notification for task:', task);
    
    if (!this.isSupported || this.permission !== 'granted') {
      console.warn('Cannot show notification: permission not granted or not supported', {
        isSupported: this.isSupported,
        permission: this.permission
      });
      return;
    }

    try {
      const notification = new Notification('Task Reminder', {
        body: `${task.title} is in 10 minutes`,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: `reminder-${task.id}`, // Prevent duplicate notifications
        requireInteraction: false,
        silent: false,
      });

      console.log('Notification created successfully:', notification);

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  /**
   * Check if notifications are available and permitted
   * @returns {boolean}
   */
  canNotify() {
    return this.isSupported && this.permission === 'granted';
  }

  /**
   * Get permission status
   * @returns {string} 'granted', 'denied', 'default', 'unsupported'
   */
  getPermissionStatus() {
    return this.permission;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
