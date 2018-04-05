import { JSDOM } from 'jsdom';
import * as debug from 'debug';

import Resolver from '../resolver';
import Post from '../../../models/post';
import uploadFromUrl from '../../../api/drive/upload-from-url';
import createPost from '../../../api/post/create';

const log = debug('misskey:activitypub');

export default async (actor, activity): Promise<void> => {
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
		createImage(object);
		break;

	case 'Note':
		createNote(object);
		break;

	default:
		console.warn(`Unknown type: ${object.type}`);
		break;
	}

	///

	async function createImage(image) {
		if ('attributedTo' in image && actor.account.uri !== image.attributedTo) {
			log(`invalid image: ${JSON.stringify(image, null, 2)}`);
			throw new Error('invalid image');
		}

		log(`Creating the Image: ${uri}`);

		return await uploadFromUrl(image.url, actor);
	}

	async function createNote(note) {
		if (
			('attributedTo' in note && actor.account.uri !== note.attributedTo) ||
			typeof note.id !== 'string'
		) {
			log(`invalid note: ${JSON.stringify(note, null, 2)}`);
			throw new Error('invalid note');
		}

		log(`Creating the Note: ${uri}`);

		const media = [];
		if ('attachment' in note && note.attachment != null) {
			note.attachment.forEach(async media => {
				const created = await createImage(media);
				media.push(created);
			});
		}

		let reply = null;
		if ('inReplyTo' in note && note.inReplyTo != null) {
			const inReplyToPost = await Post.findOne({ uri: note.id || note });
			if (inReplyToPost) {
				reply = inReplyToPost;
			} else {
				reply = await createNote(await resolver.resolve(note));
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
};
