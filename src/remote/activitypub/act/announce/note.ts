import * as debug from 'debug';

import Resolver from '../../resolver';
import Note from '../../../../models/note';
import post from '../../../../services/note/create';
import { IRemoteUser, isRemoteUser } from '../../../../models/user';
import { IAnnounce, INote } from '../../type';
import createNote from '../create/note';
import resolvePerson from '../../resolve-person';

const log = debug('misskey:activitypub');

/**
 * アナウンスアクティビティを捌きます
 */
export default async function(resolver: Resolver, actor: IRemoteUser, activity: IAnnounce, note: INote): Promise<void> {
	const uri = activity.id || activity;

	if (typeof uri !== 'string') {
		throw new Error('invalid announce');
	}

	// 既に同じURIを持つものが登録されていないかチェック
	const exist = await Note.findOne({ uri });
	if (exist) {
		return;
	}

	// アナウンス元の投稿の投稿者をフェッチ
	const announcee = await resolvePerson(note.attributedTo);

	const renote = isRemoteUser(announcee)
		? await createNote(resolver, announcee, note, true)
		: await Note.findOne({ _id: note.id.split('/').pop() });

	log(`Creating the (Re)Note: ${uri}`);

	//#region Visibility
	let visibility = 'public';
	if (!activity.to.includes('https://www.w3.org/ns/activitystreams#Public')) visibility = 'unlisted';
	if (activity.cc.length == 0) visibility = 'private';
	// TODO
	if (visibility != 'public') throw new Error('unspported visibility');
	//#endergion

	await post(actor, {
		createdAt: new Date(activity.published),
		renote,
		visibility,
		uri
	});
}
