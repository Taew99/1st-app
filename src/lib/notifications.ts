// Push notifications require a native build (EAS Build).
// Stubbed out for Expo Go development.

export async function registerForPushNotificationsAsync(): Promise<void> {
  // no-op in Expo Go
}

export async function scheduleLocalNotification(
  _title: string,
  _body: string,
  _hour: number,
  _minute: number,
): Promise<string> {
  return '';
}

export async function cancelAllScheduledNotifications(): Promise<void> {
  // no-op
}
