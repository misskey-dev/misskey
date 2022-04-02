import { db } from '@/db/postgre.js';
import { Relay } from '@/models/entities/relay.js';

export const RelayRepository = db.getRepository(Relay).extend({
});
