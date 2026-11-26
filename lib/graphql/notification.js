// GraphQL queries and mutations for Notifications matching GoCart Backend schema

export const GET_NOTIFICATIONS_QUERY = `
  query GetNotifications($userId: ID, $filter: NotificationFilterInput, $limit: Int, $offset: Int) {
    notifications(userId: $userId, filter: $filter, limit: $limit, offset: $offset) {
      notifications {
        id
        userId
        channel
        eventType
        eventId
        recipient
        subject
        content
        status
        errorMessage
        isRead
        readAt
        sentAt
        correlationId
        createdAt
        updatedAt
      }
      total
      unreadCount
    }
  }
`;

export const UNREAD_NOTIFICATION_COUNT_QUERY = `
  query UnreadNotificationCount {
    unreadNotificationCount
  }
`;

export const MARK_NOTIFICATION_AS_READ_MUTATION = `
  mutation MarkNotificationAsRead($notificationId: ID!, $isRead: Boolean) {
    markNotificationAsRead(notificationId: $notificationId, isRead: $isRead) {
      id
      isRead
      readAt
    }
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ_MUTATION = `
  mutation MarkAllNotificationsAsRead {
    markAllNotificationsAsRead {
      updatedCount
      success
    }
  }
`;

export const GET_PUSH_SUBSCRIPTIONS_QUERY = `
  query PushSubscriptions($activeOnly: Boolean) {
    pushSubscriptions(activeOnly: $activeOnly) {
      subscriptions {
        id
        userId
        endpoint
        userAgent
        deviceName
        isActive
        failureCount
        lastError
        lastUsedAt
        deactivatedAt
        createdAt
        updatedAt
      }
      total
    }
  }
`;

export const GET_VAPID_PUBLIC_KEY_QUERY = `
  query VapidPublicKey {
    vapidPublicKey {
      publicKey
      subject
    }
  }
`;

export const REGISTER_PUSH_SUBSCRIPTION_MUTATION = `
  mutation RegisterPushSubscription($input: RegisterPushSubscriptionInput!) {
    registerPushSubscription(input: $input) {
      id
      endpoint
      deviceName
      isActive
      createdAt
    }
  }
`;

export const UPDATE_PUSH_SUBSCRIPTION_MUTATION = `
  mutation UpdatePushSubscription($input: UpdatePushSubscriptionInput!) {
    updatePushSubscription(input: $input) {
      id
      endpoint
      deviceName
      isActive
      updatedAt
    }
  }
`;

export const DEACTIVATE_PUSH_SUBSCRIPTION_MUTATION = `
  mutation DeactivatePushSubscription($id: ID, $endpoint: String) {
    deactivatePushSubscription(id: $id, endpoint: $endpoint)
  }
`;
