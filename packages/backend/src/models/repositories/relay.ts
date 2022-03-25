import { dataSource } from '@/db/postgre.js';
import { Relay } from '@/models/entities/relay.js';

export const RelayRepository = dataSource.getRepository(Relay).extend({
});
