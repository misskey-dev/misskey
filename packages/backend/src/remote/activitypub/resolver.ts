import config from '@/config/index.js';
import { getJson } from '@/misc/fetch.js';
import { ILocalUser } from '@/models/entities/user.js';
import { getInstanceActor } from '@/services/instance-actor.js';
import { fetchMeta } from '@/misc/fetch-meta.js';
import { extractDbHost, isSelfHost } from '@/misc/convert-host.js';
import { signedGet } from './request.js';
import { IObject, isCollectionOrOrderedCollection, ICollection, IOrderedCollection } from './type.js';
import { FollowRequests, Notes, NoteReactions, Polls, Users } from '@/models/index.js';
import { parseUri } from './db-resolver.js';
import renderNote from '@/remote/activitypub/renderer/note.js';
import { renderLike } from '@/remote/activitypub/renderer/like.js';
import { renderPerson } from '@/remote/activitypub/renderer/person.js';
import renderQuestion from '@/remote/activitypub/renderer/question.js';
import renderCreate from '@/remote/activitypub/renderer/create.js';
import { renderActivity } from '@/remote/activitypub/renderer/index.js';
import renderFollow from '@/remote/activitypub/renderer/follow.js';

export default class Resolver {
	private history: Set<string>;
	private user?: ILocalUser;

	constructor() {
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

		const meta = await fetchMeta();
		if (meta.blockedHosts.includes(host)) {
			throw new Error('Instance is blocked');
		}

		if (config.signToActivityPubGet && !this.user) {
			this.user = await getInstanceActor();
		}

		const object = (this.user
			? await signedGet(value, this.user)
			: await getJson(value, 'application/activity+json, application/ld+json')) as IObject;

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
				return Notes.findOneByOrFail({ id: parsed.id })
				.then(note => {
					if (parsed.rest === 'activity') {
						// this refers to the create activity and not the note itself
						return renderActivity(renderCreate(renderNote(note)));
					} else {
						return renderNote(note);
					}
				});
			case 'users':
				return Users.findOneByOrFail({ id: parsed.id })
				.then(user => renderPerson(user as ILocalUser));
			case 'questions':
				// Polls are indexed by the note they are attached to.
				return Promise.all([
					Notes.findOneByOrFail({ id: parsed.id }),
					Polls.findOneByOrFail({ noteId: parsed.id }),
				])
				.then(([note, poll]) => renderQuestion({ id: note.userId }, note, poll));
			case 'likes':
				return NoteReactions.findOneByOrFail({ id: parsed.id }).then(reaction => renderActivity(renderLike(reaction, { uri: null })));
			case 'follows':
				// rest should be <followee id>
				if (parsed.rest == null || !/^\w+$/.test(parsed.rest)) throw new Error('resolveLocal: invalid follow URI');

				return Promise.all(
					[parsed.id, parsed.rest].map(id => Users.findOneByOrFail({ id }))
				)
				.then(([follower, followee]) => renderActivity(renderFollow(follower, followee, url)));
			default:
				throw new Error(`resolveLocal: type ${type} unhandled`);
		}
	}
}
