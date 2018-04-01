import { JSDOM } from 'jsdom';
import config from '../../../conf';
import Post from '../../../models/post';
import RemoteUserObject, { IRemoteUserObject } from '../../../models/remote-user-object';
import uploadFromUrl from '../../drive/upload_from_url';
import Resolver from './resolver';
const createDOMPurify = require('dompurify');

function createRemoteUserObject($ref, $id, { id }) {
	const object = { $ref, $id };

	if (!id) {
		return { object };
	}

	return RemoteUserObject.insert({ uri: id, object });
}

async function createImage(actor, object) {
	if ('attributedTo' in object && actor.account.uri !== object.attributedTo) {
		throw new Error();
	}

	const { _id } = await uploadFromUrl(object.url, actor);
	return createRemoteUserObject('driveFiles.files', _id, object);
}

async function createNote(resolver, actor, object) {
	if ('attributedTo' in object && actor.account.uri !== object.attributedTo) {
		throw new Error();
	}

	const mediaIds = 'attachment' in object &&
		(await Promise.all(await create(resolver, actor, object.attachment)))
			.filter(media => media !== null && media.object.$ref === 'driveFiles.files')
			.map(({ object }) => object.$id);

	const { window } = new JSDOM(object.content);

	const { _id } = await Post.insert({
		channelId: undefined,
		index: undefined,
		createdAt: new Date(object.published),
		mediaIds,
		replyId: undefined,
		repostId: undefined,
		poll: undefined,
		text: window.document.body.textContent,
		textHtml: object.content && createDOMPurify(window).sanitize(object.content),
		userId: actor._id,
		appId: null,
		viaMobile: false,
		geo: undefined
	});

	// Register to search database
	if (object.content && config.elasticsearch.enable) {
		const es = require('../../db/elasticsearch');

		es.index({
			index: 'misskey',
			type: 'post',
			id: _id.toString(),
			body: {
				text: window.document.body.textContent
			}
		});
	}

	return createRemoteUserObject('posts', _id, object);
}

export default async function create(parentResolver: Resolver, actor, value): Promise<Array<Promise<IRemoteUserObject>>> {
	const results = await parentResolver.resolveRemoteUserObjects(value);

	return results.map(promisedResult => promisedResult.then(({ resolver, object }) => {
		switch (object.type) {
		case 'Image':
			return createImage(actor, object);

		case 'Note':
			return createNote(resolver, actor, object);
		}

		return null;
	}));
}
