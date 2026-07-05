import { EntityManager } from '@mikro-orm/core';

import { sendPushNotification } from '../utils/notification.util';

import { BaseService } from './base.service';
import { createServiceResponse, ServiceResponse } from '../utils/response.util';
import { PushToken } from '../entities/PushToken.entity';
import { ErrorUtils } from '../utils/error.utils';
import { JwtPayload } from '../utils/auth.utils';
import User from '../entities/User.entity';

export class PushTokenService extends BaseService {
  constructor(em: EntityManager) {
    super(em);
  }

  // registerToken — añadir parámetro platform
  public async registerToken(
    currentUser: JwtPayload | null,
    token: string,
    platform: string
  ): Promise<ServiceResponse> {
    if (!currentUser) throw ErrorUtils.unauthorized('You must be logged in');

    try {
      const existing = await this.em.findOne(
        PushToken,
        { token },
        { filters: { companyContext: false } }
      );

      if (existing) {
        // Actualizar usuario y platform si cambió
        if (existing.user.id !== currentUser.id) {
          existing.user = this.em.getReference(User, currentUser.id);
        }
        existing.platform = platform;
        await this.em.flush();
      } else {
        const newToken = this.em.create(PushToken, {
          token,
          platform,
          enabled: true,
          user: currentUser.id,
        });
        this.em.persist(newToken);
        await this.em.flush();
      }

      return createServiceResponse(201, 'The token has been registered', true);
    } catch (e: any) {
      throw ErrorUtils.internal(`Error registering token ${e.message}`);
    }
  }

  // togglePushToken — nuevo método
  public async togglePushToken(
    currentUser: JwtPayload | null,
    token: string,
    enabled: boolean
  ): Promise<ServiceResponse> {
    if (!currentUser) throw ErrorUtils.unauthorized('You must be logged in');

    const pushToken = await this.em.findOne(PushToken, {
      token,
      user: currentUser.id,
    });

    if (!pushToken) {
      throw ErrorUtils.notFound('Push token not found for the current user');
    }

    pushToken.enabled = enabled;
    await this.em.flush();

    return createServiceResponse(
      200,
      `Push notifications ${enabled ? 'enabled' : 'disabled'} successfully`,
      true
    );
  }

  public async isPushTokenEnabled(
    currentUser: JwtPayload | null,
    token: string
  ): Promise<boolean> {
    if (!currentUser) throw ErrorUtils.unauthorized('You must be logged in');

    const pushToken = await this.em.findOne(PushToken, {
      token,
      user: currentUser.id,
    });

    if (!pushToken) throw ErrorUtils.notFound('Push token not found');

    return pushToken.enabled;
  }
  /**
   * Enviar notificación push a usuarios
   */
  public async sendNotification(
    currentUser: JwtPayload | null,
    title: string,
    body: string,
    forAll: boolean = false
  ): Promise<ServiceResponse> {
    if (!currentUser) {
      throw ErrorUtils.unauthorized('You must be logged in');
    }

    let tokens: PushToken[];

    if (forAll) {
      // Enviar a todos los usuarios
      tokens = await this.em.findAll(PushToken);
    } else {
      // Enviar solo al usuario actual
      tokens = await this.em.find(PushToken, { user: currentUser.id });
    }

    if (!tokens.length) {
      throw ErrorUtils.notFound('No tokens found');
    }

    // Enviar notificaciones
    const results = await this.sendNotifications(tokens, title, body);

    return createServiceResponse(201, 'The message has been sent', true, {
      sent: results.sent,
      failed: results.failed,
      total: tokens.length,
    });
  }

  /**
   * Remover push token
   */
  public async removePushToken(
    currentUser: JwtPayload | null,
    token: string
  ): Promise<ServiceResponse> {
    if (!currentUser) {
      throw ErrorUtils.unauthorized('You must be logged in');
    }
    const pushTokenRepo = this.em.getRepository(PushToken);
    const pushToken = await pushTokenRepo.findOne({
      token,
      user: currentUser.id,
    });

    if (!pushToken) {
      throw ErrorUtils.notFound('Push token not found for the current user');
    }

    this.em.remove(pushToken);
    await this.em.flush();

    return createServiceResponse(200, 'Push token removed successfully', true);
  }

  // ============= MÉTODOS PRIVADOS =============

  /**
   * Enviar notificaciones a múltiples tokens
   */
  private async sendNotifications(
    tokens: PushToken[],
    title: string,
    body: string
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const token of tokens) {
      try {
        await sendPushNotification(token.token, title, body);
        sent++;
      } catch (error) {
        console.error(
          `Failed to send notification to token ${token.token}:`,
          error
        );
        failed++;
      }
    }

    return { sent, failed };
  }
}
