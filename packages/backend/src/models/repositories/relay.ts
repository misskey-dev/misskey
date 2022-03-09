import { EntityRepository, Repository } from 'typeorm';
import { Relay } from '@/models/entities/relay.js';

@EntityRepository(Relay)
export class RelayRepository extends Repository<Relay> {
}
