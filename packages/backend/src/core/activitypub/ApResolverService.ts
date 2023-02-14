import { Inject, Injectable } from '@nestjs/common';
import type { LocalUser } from '@/models/entities/User.js';
import { InstanceActorService } from '@/core/InstanceActorService.js';
import type { NotesRepository, PollsRepository, NoteReactionsRepository, UsersRepository } from '@/models/index.js';
import type { Config } from '@/config.js';
import { MetaService } from '@/core/MetaService.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { DI } from '@/di-symbols.js';
import { UtilityService } from '@/core/UtilityService.js';
import { bindThis } from '@/decorators.js';
import { LoggerService } from '@/core/LoggerService.js';
import type Logger from '@/logger.js';
import { isCollectionOrOrderedCollection } from './type.js';
import { ApDbResolverService } from './ApDbResolverService.js';
import { ApRendererService } from './ApRendererService.js';
import { ApRequestService } from './ApRequestService.js';
import type { IObject, ICollection, IOrderedCollection } from './type.js';

export class Resolver {
	private history: Set<string>;
	private user?: LocalUser;
	private logger: Logger;

	constructor(
		private config: Config,
		private usersRepository: UsersRepository,
		private notesRepository: NotesRepository,
		private pollsRepository: PollsRepository,
		private noteReactionsRepository: NoteReactionsRepository,
		private utilityService: UtilityService,
		private instanceActorService: InstanceActorService,
		private metaService: MetaService,
		private apRequestService: ApRequestService,
		private httpRequestService: HttpRequestService,
		private apRendererService: ApRendererService,
		private apDbResolverService: ApDbResolverService,
		private loggerService: LoggerService,
		private recursionLimit = 100,
	) {
		this.history = new Set();
		this.logger = this.loggerService.getLogger('ap-resolve');
	}

	@bindThis
	public getHistory(): string[] {
		return Array.from(this.history);
	}

	@bindThis
	public async resolveCollection(value: string | IObject): Promise<ICollection | IOrderedCollection> {
		const collection = typeof value === 'string'
			? await this.resolve(value)
			: value;

		if (isCollectionOrOrderedCollection(collection)) {
			return collection;
		} else {
			throw new Error(`unrecognized collection type: ${collection.type}`);
		}
	}

	@bindThis
	public async resolve(value: string | IObject): Promise<IObject> {
		if (value == null) {
			throw new Error('resolvee is null (or undefined)');
		}

		if (typeof value !== 'string') {
			return value;
		}

		if (value.includes('#')) {
			// URLs with fragment parts cannot be resolved correctly because
			// the fragment part does not get transmitted over HTTP(S).
			// Avoid strange behaviour by not trying to resolve these at all.
			throw new Error(`cannot resolve URL with fragment: ${value}`);
		}

		if (this.history.has(value)) {
			throw new Error('cannot resolve already resolved one');
		}

		if (this.history.size > this.recursionLimit) {
			throw new Error(`hit recursion limit: ${this.utilityService.extractDbHost(value)}`);
		}

		this.history.add(value);

		const host = this.utilityService.extractDbHost(value);
		if (this.utilityService.isSelfHost(host)) {
			return await this.resolveLocal(value);
		}

		const meta = await this.metaService.fetch();
		if (this.utilityService.isBlockedHost(meta.blockedHosts, host)) {
			throw new Error('Instance is blocked');
		}

		if (this.config.signToActivityPubGet && !this.user) {
			this.user = await this.instanceActorService.getInstanceActor();
		}

		const object = (this.user
			? await this.apRequestService.signedGet(value, this.user) as IObject
			: await this.httpRequestService.getJson(value, 'application/activity+json, application/ld+json')) as IObject;

		if (object == null || (
			Array.isArray(object['@context']) ?
				!(object['@context'] as unknown[]).includes('https://www.w3.org/ns/activitystreams') :
				object['@context'] !== 'https://www.w3.org/ns/activitystreams'
		)) {
			throw new Error('invalid response');
		}

		return object;
	}

	@bindThis
	private resolveLocal(url: string): Promise<IObject> {
		const parsed = this.apDbResolverService.parseUri(url);
		if (!parsed.local) throw new Error('resolveLocal: not local');

		switch (parsed.type) {
			case 'notes':
				return this.notesRepository.findOneByOrFail({ id: parsed.id })
					.then(async note => {
						if (parsed.rest === 'activity') {
							// this refers to the create activity and not the note itself
							return this.apRendererService.addContext(this.apRendererService.renderCreate(await this.apRendererService.renderNote(note), note));
						} else {
							return this.apRendererService.renderNote(note);
						}
					});
			case 'users':
				return this.usersRepository.findOneByOrFail({ id: parsed.id })
					.then(user => this.apRendererService.renderPerson(user as LocalUser));
			case 'questions':
				// Polls are indexed by the note they are attached to.
				return Promise.all([
					this.notesRepository.findOneByOrFail({ id: parsed.id }),
					this.pollsRepository.findOneByOrFail({ noteId: parsed.id }),
				])
					.then(([note, poll]) => this.apRendererService.renderQuestion({ id: note.userId }, note, poll));
			case 'likes':
				return this.noteReactionsRepository.findOneByOrFail({ id: parsed.id }).then(async reaction =>
					this.apRendererService.addContext(await this.apRendererService.renderLike(reaction, { uri: null })));
			case 'follows':
				// rest should be <followee id>
				if (parsed.rest == null || !/^\w+$/.test(parsed.rest)) throw new Error('resolveLocal: invalid follow URI');

				return Promise.all(
					[parsed.id, parsed.rest].map(id => this.usersRepository.findOneByOrFail({ id })),
				)
					.then(([follower, followee]) => this.apRendererService.addContext(this.apRendererService.renderFollow(follower, followee, url)));
			default:
				throw new Error(`resolveLocal: type ${parsed.type} unhandled`);
		}
	}
}

@Injectable()
export class ApResolverService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		@Inject(DI.pollsRepository)
		private pollsRepository: PollsRepository,

		@Inject(DI.noteReactionsRepository)
		private noteReactionsRepository: NoteReactionsRepository,

		private utilityService: UtilityService,
		private instanceActorService: InstanceActorService,
		private metaService: MetaService,
		private apRequestService: ApRequestService,
		private httpRequestService: HttpRequestService,
		private apRendererService: ApRendererService,
		private apDbResolverService: ApDbResolverService,
		private loggerService: LoggerService,
	) {
	}

	@bindThis
	public createResolver(): Resolver {
		return new Resolver(
			this.config,
			this.usersRepository,
			this.notesRepository,
			this.pollsRepository,
			this.noteReactionsRepository,
			this.utilityService,
			this.instanceActorService,
			this.metaService,
			this.apRequestService,
			this.httpRequestService,
			this.apRendererService,
			this.apDbResolverService,
			this.loggerService,
		);
	}
}
