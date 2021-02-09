export function markNotificationRead(notification: any) {
    return { ...notification, isRead: true };
}
