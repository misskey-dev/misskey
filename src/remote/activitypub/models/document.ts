import Resolver from '../resolver';
import post from '../../../services/note/create';
import { resolvePerson, updatePerson } from './person';
import { IRemoteUser, User } from '../../../models/entities/user';
import { fromHtml } from '../../../mfm/fromHtml';
import { extractHashtags } from './tag';
import { apLogger } from '../logger';
import { extractDbHost } from '../../../misc/convert-host';
import { Note } from '../../../models/entities/note';
import { IObject, getApIds, getOneApId, getApId, isDocumentLike } from '../type';

const logger = apLogger;

export function validatePureDocument(object: any, uri: string) {
	const expectHost = extractDbHost(uri);

	if (object == null) {
		return new Error('invalid Document: object is null');
	}

	if (object.id && extractDbHost(object.id) !== expectHost) {
		return new Error(`invalid Document: id has different host. expected: ${expectHost}, actual: ${extractDbHost(object.id)}`);
	}

	if (object.attributedTo && extractDbHost(getOneApId(object.attributedTo)) !== expectHost) {
		return new Error(`invalid Document: attributedTo has different host. expected: ${expectHost}, actual: ${extractDbHost(object.attributedTo)}`);
	}

	return null;
}

export async function createPureDocument(value: string | IObject, resolver?: Resolver, silent = false): Promise<Note | null> {
	if (resolver == null) resolver = new Resolver();

	const document = await resolver.resolve(value);

	if (!isDocumentLike(document)) {
		throw new Error(`invalid Document: invalied object type ${document.type}`);
	}

	const err = validatePureDocument(document, getApId(value));
	if (err) {
		logger.error(`${err.message}`, {
			resolver: {
				history: resolver.getHistory()
			},
			value: value,
			object: document
		});
		throw new Error('invalid document');
	}

	logger.debug(`Document fetched: ${JSON.stringify(document, null, 2)}`);

	logger.info(`Creating the Document: ${document.id}`);

	// 投稿者をフェッチ
	const actor = await resolvePerson(getOneApId(document.attributedTo), resolver) as IRemoteUser;

	// 投稿者が凍結されていたらスキップ
	if (actor.isSuspended) {
		throw new Error('actor has been suspended');
	}

	//#region Visibility
	document.to = getApIds(document.to);
	document.cc = getApIds(document.cc);

	let visibility = 'public';
	let visibleUsers: User[] = [];
	if (!document.to.includes('https://www.w3.org/ns/activitystreams#Public')) {
		if (document.cc.includes('https://www.w3.org/ns/activitystreams#Public')) {
			visibility = 'home';
		} else if (document.to.includes(`${actor.uri}/followers`)) {	// TODO: person.followerと照合するべき？
			visibility = 'followers';
		} else {
			visibility = 'specified';
			visibleUsers = await Promise.all(document.to.map(uri => resolvePerson(uri, resolver)));
		}
}
	//#endergion

	const apHashtags = await extractHashtags(document.tag);

	const cw = document.summary === '' ? null : document.summary;

	// テキストのパース
	const text = document.content ? fromHtml(document.content) : null;

	// ユーザーの情報が古かったらついでに更新しておく
	if (actor.lastFetchedAt == null || Date.now() - actor.lastFetchedAt.getTime() > 1000 * 60 * 60 * 24) {
		if (actor.uri) updatePerson(actor.uri);
	}

	return await post(actor, {
		createdAt: document.published ? new Date(document.published) : null,
		files: [],
		reply: null,
		renote: null,
		name: document.name,
		cw,
		text,
		viaMobile: false,
		localOnly: false,
		geo: undefined,
		visibility,
		visibleUsers,
		apMentions: [],
		apHashtags,
		apEmojis: [],
		uri: document.id,
	}, silent);
}
