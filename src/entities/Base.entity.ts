import { randomUUID } from 'node:crypto';

import { Index, OptionalProps, PrimaryKey, Property, t } from '@mikro-orm/core';

export abstract class BaseEntity {
    [OptionalProps]?: any;

    @PrimaryKey({ type: t.uuid })
    id: string = randomUUID();

    @Property({ onCreate: () => new Date() })
    @Index()
    createdAt: Date = new Date();

    // IMPORTANTE: Añade onCreate también aquí para que tenga valor inicial
    @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
    updatedAt: Date = new Date();
}
