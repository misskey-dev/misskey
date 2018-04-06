import { JSDOM } from 'jsdom';
import { ObjectID } from 'mongodb';
import parseAcct from '../../acct/parse';
import config from '../../config';
import DriveFile from '../../models/drive-file';
import Post from '../../models/post';
import User from '../../models/user';
import { IRemoteUser } from '../../models/user';
import uploadFromUrl from '../../drive/upload-from-url';
import createPost from '../../post/create';
import distributePost from '../../post/distribute';
import resolvePerson from './resolve-person';
import Resolver from './resolver';
const createDOMPurify = require('dompurify');

type IResult = {
	resolver: Resolver;
	object: {
		$ref: string;
		$id: ObjectID;
	};
};

class Creator {
	private actor: IRemoteUser;
	private distribute: boolean;

	constructor(actor, distribute) {
		this.actor = actor;
		this.distribute = distribute;
	}

	private async createImage(resolver: Resolver, image) {
		if ('attributedTo' in image && this.actor.account.uri !== image.attributedTo) {
			throw new Error();
		}

		const { _id } = await uploadFromUrl(image.url, this.actor, image.id || null);
		return {
			resolver,
			object: { $ref: 'driveFiles.files', $id: _id }
		};
	}

	private async createNote(resolver: Resolver, note) {
		if (
			('attributedTo' in note && this.actor.account.uri !== note.attributedTo) ||
			typeof note.id !== 'string'
		) {
			throw new Error();
		}

		const { window } = new JSDOM(note.content);
		const mentions = [];
		const tags = [];

		for (const { href, name, type } of note.tags) {
			switch (type) {
			case 'Hashtag':
				if (name.startsWith('#')) {
					tags.push(name.slice(1));
				}
				break;

			case 'Mention':
				mentions.push(resolvePerson(resolver, href));
				break;
			}
		}

		const [mediaIds, reply] = await Promise.all([
			'attachment' in note && this.create(resolver, note.attachment)
				.then(collection => Promise.all(collection))
				.then(collection => collection
					.filter(media => media !== null && media.object.$ref === 'driveFiles.files')
					.map(({ object }: IResult) => object.$id)),

			'inReplyTo' in note && this.create(resolver, note.inReplyTo)
				.then(collection => Promise.all(collection.map(promise => promise.then(result => {
					if (result !== null && result.object.$ref === 'posts') {
						throw result.object;
					}
				}, () => { }))))
				.then(() => null, ({ $id }) => Post.findOne({ _id: $id }))
		]);

		const inserted = await createPost({
			channelId: undefined,
			index: undefined,
			createdAt: new Date(note.published),
			mediaIds,
			poll: undefined,
			text: window.document.body.textContent,
			textHtml: note.content && createDOMPurify(window).sanitize(note.content),
			userId: this.actor._id,
			appId: null,
			viaMobile: false,
			geo: undefined,
			uri: note.id,
			tags
		}, reply, null, await Promise.all(mentions));

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

		return {
			resolver,
			object: { $ref: 'posts', id: inserted._id }
		};
	}

	public async create(parentResolver: Resolver, value): Promise<Array<Promise<IResult>>> {
		const collection = await parentResolver.resolveCollection(value);

		return collection.object.map(async element => {
			const uri = element.id || element;
			const localPrefix = config.url + '/@';

			if (uri.startsWith(localPrefix)) {
				const [acct, id] = uri.slice(localPrefix).split('/', 2);
				const user = await User.aggregate([
					{
						$match: parseAcct(acct)
					},
					{
						$lookup: {
							from: 'posts',
							localField: '_id',
							foreignField: 'userId',
							as: 'post'
						}
					},
					{
						$match: {
							post: { _id: id }
						}
					}
				]);

				if (user === null || user.posts.length <= 0) {
					throw new Error();
				}

				return {
					resolver: collection.resolver,
					object: {
						$ref: 'posts',
						id
					}
				};
			}

			try {
				await Promise.all([
					DriveFile.findOne({ 'metadata.uri': uri }).then(file => {
						if (file === null) {
							return;
						}

						throw {
							$ref: 'driveFile.files',
							$id: file._id
						};
					}, () => {}),
					Post.findOne({ uri }).then(post => {
						if (post === null) {
							return;
						}

						throw {
							$ref: 'posts',
							$id: post._id
						};
					}, () => {})
				]);
			} catch (object) {
				return {
					resolver: collection.resolver,
					object
				};
			}

			const { resolver, object } = await collection.resolver.resolveOne(element);

			switch (object.type) {
			case 'Image':
				return this.createImage(resolver, object);

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
