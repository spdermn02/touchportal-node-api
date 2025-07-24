import type { TouchPortalIncomingEventType } from './touch-portal-incoming-event-type';

/**
 * Touch Portal will send a message when a user clicks on a notification action.
 * When they do the notification is also marked as read/handled.
 *
 * https://www.touch-portal.com/api/index.php?section=communication_listen_notification_action
 *
 * @property type - The event type, always set to 'notificationOptionClicked'.
 * @property notificationId - The id of the notification.
 * @property optionId - The id of the option.
 */
export type NotificationActionEvent = {
  type: TouchPortalIncomingEventType.NotificationAction;
  notificationId: string;
  optionId: string;
};
