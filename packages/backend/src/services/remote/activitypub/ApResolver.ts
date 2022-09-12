import type { ILocalUser } from '@/models/entities/user.js';
import type { InstanceActorService } from '@/services/InstanceActorService.js';
import { extractDbHost, isSelfHost } from '@/misc/convert-host.js';
import type { Notes , Polls , NoteReactions , Users } from '@/models/index.js';
import type { Config } from '@/config/types.js';
import type { MetaService } from '@/services/MetaService.js';
import type { HttpRequestService } from '@/services/HttpRequestService.js';
import { isCollectionOrOrderedCollection } from './type.js';
import { parseUri } from './db-resolver.js';
import type { ApRendererService } from './ApRendererService.js';
import type { IObject, ICollection, IOrderedCollection } from './type.js';
import type { ApRequestService } from './ApRequestService.js';

export class ApResolver {
	private history: Set<string>;
	private user?: ILocalUser;

	constructor(
		private config: Config,

		private usersRepository: typeof Users,
		private notesRepository: typeof Notes,
		private pollsRepository: typeof Polls,
		private noteReactionsRepository: typeof NoteReactions,

		private instanceActorService: InstanceActorService,
		private metaService: MetaService,
		private apRequestService: ApRequestService,
		private httpRequestService: HttpRequestService,
		private apRendererService: ApRendererService,
	) {
		this.history = new Set();
	}

	public getHistory(): string[] {
		return Array.from(this.history);
	}

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

		this.history.add(value);

		const host = extractDbHost(value);
		if (isSelfHost(host)) {
			return await this.resolveLocal(value);
		}

		const meta = await this.metaService.fetch();
		if (meta.blockedHosts.includes(host)) {
			throw new Error('Instance is blocked');
		}

		if (this.config.signToActivityPubGet && !this.user) {
			this.user = await this.instanceActorService.getInstanceActor();
		}

		const object = (this.user
			? await this.apRequestService.signedGet(value, this.user)
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

	private resolveLocal(url: string): Promise<IObject> {
		const parsed = parseUri(url);
		if (!parsed.local) throw new Error('resolveLocal: not local');

		switch (parsed.type) {
			case 'notes':
				return this.notesRepository.findOneByOrFail({ id: parsed.id })
					.then(note => {
						if (parsed.rest === 'activity') {
						// this refers to the create activity and not the note itself
							return this.apRendererService.renderActivity(this.apRendererService.renderCreate(this.apRendererService.renderNote(note)));
						} else {
							return this.apRendererService.renderNote(note);
						}
					});
			case 'users':
				return this.usersRepository.findOneByOrFail({ id: parsed.id })
					.then(user => this.apRendererService.renderPerson(user as ILocalUser));
			case 'questions':
				// Polls are indexed by the note they are attached to.
				return Promise.all([
					this.notesRepository.findOneByOrFail({ id: parsed.id }),
					this.pollsRepository.findOneByOrFail({ noteId: parsed.id }),
				])
					.then(([note, poll]) => this.apRendererService.renderQuestion({ id: note.userId }, note, poll));
			case 'likes':
				return this.noteReactionsRepository.findOneByOrFail({ id: parsed.id }).then(reaction =>
					this.apRendererService.renderActivity(this.apRendererService.renderLike(reaction, { uri: null })));
			case 'follows':
				// rest should be <followee id>
				if (parsed.rest == null || !/^\w+$/.test(parsed.rest)) throw new Error('resolveLocal: invalid follow URI');

				return Promise.all(
					[parsed.id, parsed.rest].map(id => this.usersRepository.findOneByOrFail({ id })),
				)
					.then(([follower, followee]) => this.apRendererService.renderActivity(this.apRendererService.renderFollow(follower, followee, url)));
			default:
				throw new Error(`resolveLocal: type ${type} unhandled`);
		}
	}
}
