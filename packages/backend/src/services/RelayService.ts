import { Inject, Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { renderFollowRelay } from '@/remote/activitypub/renderer/follow-relay.js';
import { renderActivity, attachLdSignature } from '@/remote/activitypub/renderer/index.js';
import renderUndo from '@/remote/activitypub/renderer/undo.js';
import type { ILocalUser, User } from '@/models/entities/user.js';
import type { Relays, Users } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';
import { Cache } from '@/misc/cache.js';
import type { Relay } from '@/models/entities/relay.js';
import type { QueueService } from '@/queue/queue.service.js';
import type { CreateSystemUserService } from './CreateSystemUserService.js';

const ACTOR_USERNAME = 'relay.actor' as const;

@Injectable()
export class RelayService {
	#relaysCache: Cache<Relay[]>;

	constructor(
		@Inject('usersRepository')
		private usersRepository: typeof Users,

		@Inject('relaysRepository')
		private relaysRepository: typeof Relays,

		private queueService: QueueService,
		private createSystemUserService: CreateSystemUserService,
	) {
		this.#relaysCache = new Cache<Relay[]>(1000 * 60 * 10);
	}

	async getRelayActor(): Promise<ILocalUser> {
		const user = await this.usersRepository.findOneBy({
			host: IsNull(),
			username: ACTOR_USERNAME,
		});
	
		if (user) return user as ILocalUser;
	
		const created = await this.createSystemUserService.createSystemUser(ACTOR_USERNAME);
		return created as ILocalUser;
	}

	async addRelay(inbox: string): Promise<Relay> {
		const relay = await this.relaysRepository.insert({
			id: genId(),
			inbox,
			status: 'requesting',
		}).then(x => this.relaysRepository.findOneByOrFail(x.identifiers[0]));
	
		const relayActor = await this.getRelayActor();
		const follow = await renderFollowRelay(relay, relayActor);
		const activity = renderActivity(follow);
		this.queueService.deliver(relayActor, activity, relay.inbox);
	
		return relay;
	}

	async removeRelay(inbox: string): Promise<void> {
		const relay = await this.relaysRepository.findOneBy({
			inbox,
		});
	
		if (relay == null) {
			throw 'relay not found';
		}
	
		const relayActor = await this.getRelayActor();
		const follow = renderFollowRelay(relay, relayActor);
		const undo = renderUndo(follow, relayActor);
		const activity = renderActivity(undo);
		this.queueService.deliver(relayActor, activity, relay.inbox);
	
		await this.relaysRepository.delete(relay.id);
	}

	async listRelay(): Promise<Relay[]> {
		const relays = await this.relaysRepository.find();
		return relays;
	}
	
	async relayAccepted(id: string): Promise<string> {
		const result = await this.relaysRepository.update(id, {
			status: 'accepted',
		});
	
		return JSON.stringify(result);
	}

	async relayRejected(id: string): Promise<string> {
		const result = await this.relaysRepository.update(id, {
			status: 'rejected',
		});
	
		return JSON.stringify(result);
	}

	async deliverToRelays(user: { id: User['id']; host: null; }, activity: any): Promise<void> {
		if (activity == null) return;
	
		const relays = await this.#relaysCache.fetch(null, () => this.relaysRepository.findBy({
			status: 'accepted',
		}));
		if (relays.length === 0) return;
	
		// TODO
		//const copy = structuredClone(activity);
		const copy = JSON.parse(JSON.stringify(activity));
		if (!copy.to) copy.to = ['https://www.w3.org/ns/activitystreams#Public'];
	
		const signed = await attachLdSignature(copy, user);
	
		for (const relay of relays) {
			this.queueService.deliver(user, signed, relay.inbox);
		}
	}
}
