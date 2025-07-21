import { NotificationOption } from './notification-option';

/**
 * As a plug-in developer you can alert your users within Touch Portal for certain events.
 * This system should only be used for important messages that the user has to act on.
 * Examples are new updates for the plugin or changing settings like credentials.
 * Maybe your user has set up the plug-in incorrectly which is also a good reason to send a notification to alert them to the issue and propose a solution.
 *
 * https://www.touch-portal.com/api/index.php?section=communication_create_notification
 *
 * @property type - The type of the request, always set to 'showNotification'.
 * @property notificationId - This is the id of this notification.
 * Every notification with a unique id will have its own entry in the notification center.
 * The same id should be used for the same kind of message to the user.
 * For example; if you want to show a notification to update to a specific version, use the same id each time you send this notification.
 * This will just show the one notification to the user.
 * @property title - This is the title of the notification.
 * @property msg - This is the message that is shown in the notification to the user.
 * @property options - This is the collection of options to go with your notification.
 * When a user clicks on the action it will be send to the plugin.
 * The plug-in then can react on the choice the user made.
 * Usually this will contain only one option such as an "Update" or "More Info" option.
 * At least one option is required.
 */
export type CreateNotificationRequest = {
  type: 'showNotification';
  notificationId: string;
  title: string;
  msg: string;
  options: NotificationOption[];
};
