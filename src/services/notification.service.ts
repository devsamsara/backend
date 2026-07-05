import { EntityManager } from '@mikro-orm/core';

import { BaseService } from './base.service';
import User from '../entities/User.entity';
import { Project } from '../entities/Project.entity';
import { sendPushNotification } from '../utils/notification.util';
import { LoggerUtils } from '../utils/logger.utils';

/**
 * Notification Service - Handles push notifications
 */

export interface PushNotificationData {
  type: string;
  [key: string]: any;
}

export class NotificationService extends BaseService {
  constructor(em: EntityManager) {
    super(em);
  }

  /**
   * Send notification to a specific user
   */
  public async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: PushNotificationData
  ): Promise<void> {
    const user = await this.em.findOne(
      User,
      { id: userId },
      { populate: ['pushTokens'] }
    );

    if (!user?.pushTokens || user.pushTokens.length === 0) {
      return;
    }

    const tokens = user.pushTokens.getItems();
    await this.sendToTokens(
      tokens.map(t => t.token),
      title,
      body,
      data
    );
  }

  /**
   * Send notification to multiple users
   */
  public async sendToUsers(
    userIds: string[],
    title: string,
    body: string,
    data?: PushNotificationData
  ): Promise<void> {
    const users = await this.em.find(
      User,
      { id: { $in: userIds } },
      { populate: ['pushTokens'] }
    );

    await this.sendToUserEntities(users, title, body, data);
  }

  /**
   * Send notification to all active users
   */
  public async sendToAllActiveUsers(
    title: string,
    body: string,
    data?: PushNotificationData,
    excludeUserId?: string
  ): Promise<void> {
    const filter: any = {
      isBlocked: false,
      isActive: true,
    };

    if (excludeUserId) {
      filter.id = { $ne: excludeUserId };
    }

    const users = await this.em.find(User, filter, {
      populate: ['pushTokens'],
    });

    await this.sendToUserEntities(users, title, body, data);
  }

  /**
   * Notify all members of a project about a timeline event.
   *
   * - Loads the project members if not already populated.
   * - Excludes the actor (the user who triggered the event) so they
   *   don't receive a notification about their own action.
   * - Only sends to members whose push tokens are registered and enabled.
   * - Fires and forgets: errors are logged but never propagate to the caller,
   *   so a notification failure never breaks the main business operation.
   *
   * @param projectId  - ID of the project whose members should be notified
   * @param title      - Notification title (e.g. "Nuevo evento en Proyecto X")
   * @param body       - Notification body (e.g. "Se añadió una foto al proyecto")
   * @param actorId    - ID of the user who triggered the event (excluded from recipients)
   * @param data       - Optional extra payload forwarded to the push notification
   */
  public async notifyProjectMembers(
    projectId: string,
    title: string,
    body: string,
    actorId?: string,
    data?: PushNotificationData
  ): Promise<void> {
    try {
      const project = await this.em.findOne(
        Project,
        { id: projectId },
        { populate: ['members', 'members.pushTokens'] }
      );

      if (!project) {
        LoggerUtils.warn(`[NotificationService] Project ${projectId} not found — skipping notifications`);
        return;
      }

      const members = project.members.getItems();

      // Filter out the actor so they don't get notified about their own action
      const recipients = actorId
        ? members.filter(m => m.id !== actorId)
        : members;

      if (recipients.length === 0) return;

      await this.sendToUserEntities(recipients, title, body, data);

      LoggerUtils.info(
        `[NotificationService] Notified ${recipients.length} member(s) of project "${project.name}" — event: ${title}`
      );
    } catch (err) {
      // Never let a notification failure break the caller
      LoggerUtils.error('[NotificationService] Failed to notify project members', { err });
    }
  }

  /**
   * Helper: Send notification to user entities
   */
  private async sendToUserEntities(
    users: User[],
    title: string,
    body: string,
    data?: PushNotificationData
  ): Promise<void> {
    for (const user of users) {
      if (user.pushTokens && user.pushTokens.length > 0) {
        // Only send to enabled tokens
        const enabledTokens = user.pushTokens
          .getItems()
          .filter(t => t.enabled)
          .map(t => t.token);

        if (enabledTokens.length > 0) {
          await this.sendToTokens(enabledTokens, title, body, data);
        }
      }
    }
  }

  /**
   * Helper: Send to specific tokens
   */
  private async sendToTokens(
    tokens: string[],
    title: string,
    body: string,
    data?: PushNotificationData
  ): Promise<void> {
    for (const token of tokens) {
      try {
        await sendPushNotification(token, title, body, data);
      } catch (error) {
        console.error(`Failed to send notification to token ${token}:`, error);
      }
    }
  }
}
