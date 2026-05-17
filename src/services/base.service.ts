import { EntityManager } from '@mikro-orm/core';
import Stripe from 'stripe';

export class BaseService {
  protected em: EntityManager;

  constructor(em: EntityManager) {
    this.em = em;
  }

}
