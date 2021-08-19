import { EntityRepository, Repository } from 'typeorm';
import { Relay } from '@/models/entities/relay';

@EntityRepository(Relay)
export class RelayRepository extends Repository<Relay> {
}
