import { JSDOM } from 'jsdom';
import * as debug from 'debug';

import Resolver from '../resolver';
import Post from '../../../models/post';
import uploadFromUrl from '../../../services/drive/upload-from-url';
import createPost from '../../../services/post/create';
import { IRemoteUser, isRemoteUser } from '../../../models/user';
import resolvePerson from '../resolve-person';

const log = debug('misskey:activitypub');

export default async (actor: IRemoteUser, activity): Promise<void> => {
	if ('actor' in activity && actor.account.uri !== activity.actor) {
		throw new Error('invalid actor');
	}

	const uri = activity.id || activity;

	log(`Create: ${uri}`);

	// TODO: 同じURIをもつものが既に登録されていないかチェック

	const resolver = new Resolver();

	let object;

	try {
		object = await resolver.resolve(activity.object);
	} catch (e) {
		log(`Resolve failed: ${e}`);
		throw e;
	}

	switch (object.type) {
	case 'Image':
		createImage(resolver, actor, object);
		break;

	case 'Note':
		createNote(resolver, actor, object);
		break;

	default:
		console.warn(`Unknown type: ${object.type}`);
		break;
	}
};

async function createImage(resolver: Resolver, actor: IRemoteUser, image) {
	if ('attributedTo' in image && actor.account.uri !== image.attributedTo) {
		log(`invalid image: ${JSON.stringify(image, null, 2)}`);
		throw new Error('invalid image');
	}

	log(`Creating the Image: ${image.id}`);

	return await uploadFromUrl(image.url, actor);
}

async function createNote(resolver: Resolver, actor: IRemoteUser, note, silent = false) {
	if (
		('attributedTo' in note && actor.account.uri !== note.attributedTo) ||
		typeof note.id !== 'string'
	) {
		log(`invalid note: ${JSON.stringify(note, null, 2)}`);
		throw new Error('invalid note');
	}

	log(`Creating the Note: ${note.id}`);

	const media = [];
	if ('attachment' in note && note.attachment != null) {
		note.attachment.forEach(async media => {
			const created = await createImage(resolver, note.actor, media);
			media.push(created);
		});
	}

	let reply = null;
	if ('inReplyTo' in note && note.inReplyTo != null) {
		const inReplyToPost = await Post.findOne({ uri: note.inReplyTo.id || note.inReplyTo });
		if (inReplyToPost) {
			reply = inReplyToPost;
		} else {
			const inReplyTo = await resolver.resolve(note.inReplyTo) as any;
			const actor = await resolvePerson(inReplyTo.attributedTo);
			if (isRemoteUser(actor)) {
				reply = await createNote(resolver, actor, inReplyTo, true);
			}
		}
	}

	const { window } = new JSDOM(note.content);

	return await createPost(actor, {
		createdAt: new Date(note.published),
		media,
		reply,
		repost: undefined,
		text: window.document.body.textContent,
		viaMobile: false,
		geo: undefined,
		uri: note.id
	}, silent);
}
