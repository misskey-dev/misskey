import { JSDOM } from 'jsdom';
import * as debug from 'debug';

import Resolver from '../../resolver';
import Post, { IPost } from '../../../../models/post';
import createPost from '../../../../services/post/create';
import { IRemoteUser } from '../../../../models/user';
import resolvePerson from '../../resolve-person';
import createImage from './image';
import config from '../../../../config';

const log = debug('misskey:activitypub');

/**
 * 投稿作成アクティビティを捌きます
 */
export default async function createNote(resolver: Resolver, actor: IRemoteUser, note, silent = false): Promise<IPost> {
	if (typeof note.id !== 'string') {
		log(`invalid note: ${JSON.stringify(note, null, 2)}`);
		throw new Error('invalid note');
	}

	// 既に同じURIを持つものが登録されていないかチェックし、登録されていたらそれを返す
	const exist = await Post.findOne({ uri: note.id });
	if (exist) {
		return exist;
	}

	log(`Creating the Note: ${note.id}`);

	//#region Visibility
	let visibility = 'public';
	if (note.cc.length == 0) visibility = 'private';
	//#endergion

	//#region 添付メディア
	const media = [];
	if ('attachment' in note && note.attachment != null) {
		// TODO: attachmentは必ずしもImageではない
		// TODO: ループの中でawaitはすべきでない
		note.attachment.forEach(async media => {
			const created = await createImage(resolver, note.actor, media);
			media.push(created);
		});
	}
	//#endregion

	//#region リプライ
	let reply = null;
	if ('inReplyTo' in note && note.inReplyTo != null) {
		// リプライ先の投稿がMisskeyに登録されているか調べる
		const uri: string = note.inReplyTo.id || note.inReplyTo;
		const inReplyToPost = uri.startsWith(config.url + '/')
			? await Post.findOne({ _id: uri.split('/').pop() })
			: await Post.findOne({ uri });

		if (inReplyToPost) {
			reply = inReplyToPost;
		} else {
			// 無かったらフェッチ
			const inReplyTo = await resolver.resolve(note.inReplyTo) as any;

			// リプライ先の投稿の投稿者をフェッチ
			const actor = await resolvePerson(inReplyTo.attributedTo) as IRemoteUser;

			// TODO: silentを常にtrueにしてはならない
			reply = await createNote(resolver, actor, inReplyTo);
		}
	}
	//#endregion

	const { window } = new JSDOM(note.content);

	return await createPost(actor, {
		createdAt: new Date(note.published),
		media,
		reply,
		repost: undefined,
		text: window.document.body.textContent,
		viaMobile: false,
		geo: undefined,
		visibility,
		uri: note.id
	});
}
