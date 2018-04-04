import { JSDOM } from 'jsdom';

import Resolver from '../resolver';
import DriveFile from '../../../models/drive-file';
import Post from '../../../models/post';
import uploadFromUrl from '../../../api/drive/upload-from-url';
import createPost from '../../../api/post/create';

export default async (actor, activity): Promise<void> => {
	if ('actor' in activity && actor.account.uri !== activity.actor) {
		throw new Error('invalid actor');
	}

	const uri = activity.id || activity;

	try {
		await Promise.all([
			DriveFile.findOne({ 'metadata.uri': uri }).then(file => {
				if (file !== null) {
					throw new Error();
				}
			}, () => {}),
			Post.findOne({ uri }).then(post => {
				if (post !== null) {
					throw new Error();
				}
			}, () => {})
		]);
	} catch (object) {
		throw new Error(`already registered: ${uri}`);
	}

	const resolver = new Resolver();

	const object = await resolver.resolve(activity);

	switch (object.type) {
	case 'Image':
		createImage(resolver, object);
		break;

	case 'Note':
		createNote(resolver, object);
		break;
	}

	///

	async function createImage(resolver: Resolver, image) {
		if ('attributedTo' in image && actor.account.uri !== image.attributedTo) {
			throw new Error('invalid image');
		}

		return await uploadFromUrl(image.url, actor);
	}

	async function createNote(resolver: Resolver, note) {
		if (
			('attributedTo' in note && actor.account.uri !== note.attributedTo) ||
			typeof note.id !== 'string'
		) {
			throw new Error('invalid note');
		}

		const media = [];

		if ('attachment' in note) {
			note.attachment.forEach(async media => {
				const created = await createImage(resolver, media);
				media.push(created);
			});
		}

		const { window } = new JSDOM(note.content);

		await createPost(actor, {
			createdAt: new Date(note.published),
			media,
			reply: undefined,
			repost: undefined,
			text: window.document.body.textContent,
			viaMobile: false,
			geo: undefined,
			uri: note.id
		});
	}
};
