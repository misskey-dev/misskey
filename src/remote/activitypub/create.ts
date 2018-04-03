import { JSDOM } from 'jsdom';
import config from '../../config';
import RemoteUserObject, { IRemoteUserObject } from '../../models/remote-user-object';
import { IRemoteUser } from '../../models/user';
import uploadFromUrl from '../../drive/upload-from-url';
import createPost from '../../post/create';
import distributePost from '../../post/distribute';
import Resolver from './resolver';
const createDOMPurify = require('dompurify');

function createRemoteUserObject($ref, $id, { id }) {
	const object = { $ref, $id };

	if (!id) {
		return { object };
	}

	return RemoteUserObject.insert({ uri: id, object });
}

class Creator {
	private actor: IRemoteUser;
	private distribute: boolean;

	constructor(actor, distribute) {
		this.actor = actor;
		this.distribute = distribute;
	}

	private async createImage(image) {
		if ('attributedTo' in image && this.actor.account.uri !== image.attributedTo) {
			throw new Error();
		}

		const { _id } = await uploadFromUrl(image.url, this.actor);
		return createRemoteUserObject('driveFiles.files', _id, image);
	}

	private async createNote(resolver: Resolver, note) {
		if ('attributedTo' in note && this.actor.account.uri !== note.attributedTo) {
			throw new Error();
		}

		const mediaIds = 'attachment' in note &&
			(await Promise.all(await this.create(resolver, note.attachment)))
				.filter(media => media !== null && media.object.$ref === 'driveFiles.files')
				.map(({ object }) => object.$id);

		const { window } = new JSDOM(note.content);

		const inserted = await createPost({
			channelId: undefined,
			index: undefined,
			createdAt: new Date(note.published),
			mediaIds,
			replyId: undefined,
			repostId: undefined,
			poll: undefined,
			text: window.document.body.textContent,
			textHtml: note.content && createDOMPurify(window).sanitize(note.content),
			userId: this.actor._id,
			appId: null,
			viaMobile: false,
			geo: undefined
		}, null, null, []);

		const promisedRemoteUserObject = createRemoteUserObject('posts', inserted._id, note);
		const promises = [];

		if (this.distribute) {
			promises.push(distributePost(this.actor, inserted.mentions, inserted));
		}

		// Register to search database
		if (note.content && config.elasticsearch.enable) {
			const es = require('../../db/elasticsearch');

			promises.push(new Promise((resolve, reject) => {
				es.index({
					index: 'misskey',
					type: 'post',
					id: inserted._id.toString(),
					body: {
						text: window.document.body.textContent
					}
				}, resolve);
			}));
		}

		await Promise.all(promises);

		return promisedRemoteUserObject;
	}

	public async create(parentResolver: Resolver, value): Promise<Array<Promise<IRemoteUserObject>>> {
		const collection = await parentResolver.resolveCollection(value);

		return collection.object.map(async element => {
			if (typeof element === 'string') {
				const object = RemoteUserObject.findOne({ uri: element });

				if (object !== null) {
					return object;
				}
			}

			const { resolver, object } = await collection.resolver.resolveOne(element);

			switch (object.type) {
			case 'Image':
				return this.createImage(object);

			case 'Note':
				return this.createNote(resolver, object);
			}

			return null;
		});
	}
}

export default (resolver: Resolver, actor, value, distribute?: boolean) => {
	const creator = new Creator(actor, distribute);
	return creator.create(resolver, value);
};
