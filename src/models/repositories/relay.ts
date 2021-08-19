import { EntityRepository, Repository } from 'typeorm';
import { Relay } from '../entities/relay';

@EntityRepository(Relay)
export class RelayRepository extends Repository<Relay> {
}
