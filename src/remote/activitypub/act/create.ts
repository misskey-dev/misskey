import { JSDOM } from 'jsdom';
const createDOMPurify = require('dompurify');

import Resolver from '../resolver';
import DriveFile from '../../../models/drive-file';
import Post from '../../../models/post';
import uploadFromUrl from '../../../drive/upload-from-url';
import createPost from '../../../post/create';

export default async (resolver: Resolver, actor, activity): Promise<void> => {
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

		const mediaIds = [];

		if ('attachment' in note) {
			note.attachment.forEach(async media => {
				const created = await createImage(resolver, media);
				mediaIds.push(created._id);
			});
		}

		const { window } = new JSDOM(note.content);

		await createPost(actor, {
			channelId: undefined,
			index: undefined,
			createdAt: new Date(note.published),
			mediaIds,
			replyId: undefined,
			repostId: undefined,
			poll: undefined,
			text: window.document.body.textContent,
			textHtml: note.content && createDOMPurify(window).sanitize(note.content),
			userId: actor._id,
			appId: null,
			viaMobile: false,
			geo: undefined,
			uri: note.id
		}, null, null, []);
	}
};
