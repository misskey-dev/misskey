import { JSDOM } from 'jsdom';
import config from '../../config';
import { pack as packPost } from '../../models/post';
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

	private async createImage(object) {
		if ('attributedTo' in object && this.actor.account.uri !== object.attributedTo) {
			throw new Error();
		}

		const { _id } = await uploadFromUrl(object.url, this.actor);
		return createRemoteUserObject('driveFiles.files', _id, object);
	}

	private async createNote(resolver, object) {
		if ('attributedTo' in object && this.actor.account.uri !== object.attributedTo) {
			throw new Error();
		}

		const mediaIds = 'attachment' in object &&
			(await Promise.all(await this.create(resolver, object.attachment)))
				.filter(media => media !== null && media.object.$ref === 'driveFiles.files')
				.map(({ object }) => object.$id);

		const { window } = new JSDOM(object.content);

		const inserted = await createPost({
			channelId: undefined,
			index: undefined,
			createdAt: new Date(object.published),
			mediaIds,
			replyId: undefined,
			repostId: undefined,
			poll: undefined,
			text: window.document.body.textContent,
			textHtml: object.content && createDOMPurify(window).sanitize(object.content),
			userId: this.actor._id,
			appId: null,
			viaMobile: false,
			geo: undefined
		}, null, null, []);

		const promisedRemoteUserObject = createRemoteUserObject('posts', inserted._id, object);
		const promises = [];

		if (this.distribute) {
			promises.push(distributePost(this.actor, inserted.mentions, packPost(inserted)));
		}

		// Register to search database
		if (object.content && config.elasticsearch.enable) {
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

	public async create(parentResolver, value): Promise<Array<Promise<IRemoteUserObject>>> {
		const results = await parentResolver.resolveRemoteUserObjects(value);

		return results.map(promisedResult => promisedResult.then(({ resolver, object }) => {
			switch (object.type) {
			case 'Image':
				return this.createImage(object);

			case 'Note':
				return this.createNote(resolver, object);
			}

			return null;
		}));
	}
}

export default (resolver: Resolver, actor, value, distribute?: boolean) => {
	const creator = new Creator(actor, distribute);
	return creator.create(resolver, value);
};
