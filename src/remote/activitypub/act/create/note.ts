import { JSDOM } from 'jsdom';
import * as debug from 'debug';

import Resolver from '../../resolver';
import Post, { IPost } from '../../../../models/post';
import createPost from '../../../../services/post/create';
import { IRemoteUser, isRemoteUser } from '../../../../models/user';
import resolvePerson from '../../resolve-person';
import createImage from './image';

const log = debug('misskey:activitypub');

export default async function createNote(resolver: Resolver, actor: IRemoteUser, note): Promise<IPost> {
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
		// TODO: attachmentは必ずしもImageではない
		// TODO: ループの中でawaitはすべきでない
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
				reply = await createNote(resolver, actor, inReplyTo);
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
	});
}
