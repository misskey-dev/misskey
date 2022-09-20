import { Inject, Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';
import type { ILocalUser, User } from '@/models/entities/User.js';
import type { RelaysRepository, UsersRepository } from '@/models/index.js';
import { IdService } from '@/core/IdService.js';
import { Cache } from '@/misc/cache.js';
import type { Relay } from '@/models/entities/Relay.js';
import { QueueService } from '@/core/QueueService.js';
import { CreateSystemUserService } from '@/core/CreateSystemUserService.js';
import { ApRendererService } from '@/core/remote/activitypub/ApRendererService.js';
import { DI } from '@/di-symbols.js';

const ACTOR_USERNAME = 'relay.actor' as const;

@Injectable()
export class RelayService {
	private relaysCache: Cache<Relay[]>;

	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.relaysRepository)
		private relaysRepository: RelaysRepository,

		private idService: IdService,
		private queueService: QueueService,
		private createSystemUserService: CreateSystemUserService,
		private apRendererService: ApRendererService,
	) {
		this.relaysCache = new Cache<Relay[]>(1000 * 60 * 10);
	}

	private async getRelayActor(): Promise<ILocalUser> {
		const user = await this.usersRepository.findOneBy({
			host: IsNull(),
			username: ACTOR_USERNAME,
		});
	
		if (user) return user as ILocalUser;
	
		const created = await this.createSystemUserService.createSystemUser(ACTOR_USERNAME);
		return created as ILocalUser;
	}

	public async addRelay(inbox: string): Promise<Relay> {
		const relay = await this.relaysRepository.insert({
			id: this.idService.genId(),
			inbox,
			status: 'requesting',
		}).then(x => this.relaysRepository.findOneByOrFail(x.identifiers[0]));
	
		const relayActor = await this.getRelayActor();
		const follow = await this.apRendererService.renderFollowRelay(relay, relayActor);
		const activity = this.apRendererService.renderActivity(follow);
		this.queueService.deliver(relayActor, activity, relay.inbox);
	
		return relay;
	}

	public async removeRelay(inbox: string): Promise<void> {
		const relay = await this.relaysRepository.findOneBy({
			inbox,
		});
	
		if (relay == null) {
			throw new Error('relay not found');
		}
	
		const relayActor = await this.getRelayActor();
		const follow = this.apRendererService.renderFollowRelay(relay, relayActor);
		const undo = this.apRendererService.renderUndo(follow, relayActor);
		const activity = this.apRendererService.renderActivity(undo);
		this.queueService.deliver(relayActor, activity, relay.inbox);
	
		await this.relaysRepository.delete(relay.id);
	}

	public async listRelay(): Promise<Relay[]> {
		const relays = await this.relaysRepository.find();
		return relays;
	}
	
	public async relayAccepted(id: string): Promise<string> {
		const result = await this.relaysRepository.update(id, {
			status: 'accepted',
		});
	
		return JSON.stringify(result);
	}

	public async relayRejected(id: string): Promise<string> {
		const result = await this.relaysRepository.update(id, {
			status: 'rejected',
		});
	
		return JSON.stringify(result);
	}

	public async deliverToRelays(user: { id: User['id']; host: null; }, activity: any): Promise<void> {
		if (activity == null) return;
	
		const relays = await this.relaysCache.fetch(null, () => this.relaysRepository.findBy({
			status: 'accepted',
		}));
		if (relays.length === 0) return;
	
		// TODO
		//const copy = structuredClone(activity);
		const copy = JSON.parse(JSON.stringify(activity));
		if (!copy.to) copy.to = ['https://www.w3.org/ns/activitystreams#Public'];
	
		const signed = await this.apRendererService.attachLdSignature(copy, user);
	
		for (const relay of relays) {
			this.queueService.deliver(user, signed, relay.inbox);
		}
	}
}
