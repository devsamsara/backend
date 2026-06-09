import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import User, { UserRole } from '../entities/User.entity';

export class UserSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const existing = await em.findOne(User, { email: 'admin@example.com' });
    if (existing) return;

    const admin = em.create(User, {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'Admin1234!',
      role: UserRole.ADMIN,
    });

    const user = em.create(User, {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'User1234!',
      role: UserRole.USER,
    });

    await em.persistAndFlush([admin, user]);
    console.log('✅  Users seeded');
  }
}
