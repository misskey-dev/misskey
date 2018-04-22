/**
 * Module dependencies
 */
import $ from 'cafy';
import Note, { INote, isValidText, isValidCw, pack } from '../../../../models/note';
import { ILocalUser } from '../../../../models/user';
import Channel, { IChannel } from '../../../../models/channel';
import DriveFile from '../../../../models/drive-file';
import create from '../../../../services/note/create';
import { IApp } from '../../../../models/app';

/**
 * Create a note
 *
 * @param {any} params
 * @param {any} user
 * @param {any} app
 * @return {Promise<any>}
 */
module.exports = (params, user: ILocalUser, app: IApp) => new Promise(async (res, rej) => {
	// Get 'visibility' parameter
	const [visibility = 'public', visibilityErr] = $(params.visibility).optional.string().or(['public', 'unlisted', 'private', 'direct']).$;
	if (visibilityErr) return rej('invalid visibility');

	// Get 'text' parameter
	const [text = null, textErr] = $(params.text).optional.nullable.string().pipe(isValidText).$;
	if (textErr) return rej('invalid text');

	// Get 'cw' parameter
	const [cw, cwErr] = $(params.cw).optional.nullable.string().pipe(isValidCw).$;
	if (cwErr) return rej('invalid cw');

	// Get 'viaMobile' parameter
	const [viaMobile = false, viaMobileErr] = $(params.viaMobile).optional.boolean().$;
	if (viaMobileErr) return rej('invalid viaMobile');

	// Get 'tags' parameter
	const [tags = [], tagsErr] = $(params.tags).optional.array('string').unique().eachQ(t => t.range(1, 32)).$;
	if (tagsErr) return rej('invalid tags');

	// Get 'geo' parameter
	const [geo, geoErr] = $(params.geo).optional.nullable.strict.object()
		.have('coordinates', $().array().length(2)
			.item(0, $().number().range(-180, 180))
			.item(1, $().number().range(-90, 90)))
		.have('altitude', $().nullable.number())
		.have('accuracy', $().nullable.number())
		.have('altitudeAccuracy', $().nullable.number())
		.have('heading', $().nullable.number().range(0, 360))
		.have('speed', $().nullable.number())
		.$;
	if (geoErr) return rej('invalid geo');

	// Get 'mediaIds' parameter
	const [mediaIds, mediaIdsErr] = $(params.mediaIds).optional.array('id').unique().range(1, 4).$;
	if (mediaIdsErr) return rej('invalid mediaIds');

	let files = [];
	if (mediaIds !== undefined) {
		// Fetch files
		// forEach だと途中でエラーなどがあっても return できないので
		// 敢えて for を使っています。
		for (const mediaId of mediaIds) {
			// Fetch file
			// SELECT _id
			const entity = await DriveFile.findOne({
				_id: mediaId,
				'metadata.userId': user._id
			});

			if (entity === null) {
				return rej('file not found');
			} else {
				files.push(entity);
			}
		}
	} else {
		files = null;
	}

	// Get 'renoteId' parameter
	const [renoteId, renoteIdErr] = $(params.renoteId).optional.id().$;
	if (renoteIdErr) return rej('invalid renoteId');

	let renote: INote = null;
	let isQuote = false;
	if (renoteId !== undefined) {
		// Fetch renote to note
		renote = await Note.findOne({
			_id: renoteId
		});

		if (renote == null) {
			return rej('renoteee is not found');
		} else if (renote.renoteId && !renote.text && !renote.mediaIds) {
			return rej('cannot renote to renote');
		}

		isQuote = text != null || files != null;
	}

	// Get 'replyId' parameter
	const [replyId, replyIdErr] = $(params.replyId).optional.id().$;
	if (replyIdErr) return rej('invalid replyId');

	let reply: INote = null;
	if (replyId !== undefined) {
		// Fetch reply
		reply = await Note.findOne({
			_id: replyId
		});

		if (reply === null) {
			return rej('in reply to note is not found');
		}

		// 返信対象が引用でないRenoteだったらエラー
		if (reply.renoteId && !reply.text && !reply.mediaIds) {
			return rej('cannot reply to renote');
		}
	}

	// Get 'channelId' parameter
	const [channelId, channelIdErr] = $(params.channelId).optional.id().$;
	if (channelIdErr) return rej('invalid channelId');

	let channel: IChannel = null;
	if (channelId !== undefined) {
		// Fetch channel
		channel = await Channel.findOne({
			_id: channelId
		});

		if (channel === null) {
			return rej('channel not found');
		}

		// 返信対象の投稿がこのチャンネルじゃなかったらダメ
		if (reply && !channelId.equals(reply.channelId)) {
			return rej('チャンネル内部からチャンネル外部の投稿に返信することはできません');
		}

		// Renote対象の投稿がこのチャンネルじゃなかったらダメ
		if (renote && !channelId.equals(renote.channelId)) {
			return rej('チャンネル内部からチャンネル外部の投稿をRenoteすることはできません');
		}

		// 引用ではないRenoteはダメ
		if (renote && !isQuote) {
			return rej('チャンネル内部では引用ではないRenoteをすることはできません');
		}
	} else {
		// 返信対象の投稿がチャンネルへの投稿だったらダメ
		if (reply && reply.channelId != null) {
			return rej('チャンネル外部からチャンネル内部の投稿に返信することはできません');
		}

		// Renote対象の投稿がチャンネルへの投稿だったらダメ
		if (renote && renote.channelId != null) {
			return rej('チャンネル外部からチャンネル内部の投稿をRenoteすることはできません');
		}
	}

	// Get 'poll' parameter
	const [poll, pollErr] = $(params.poll).optional.strict.object()
		.have('choices', $().array('string')
			.unique()
			.range(2, 10)
			.each(c => c.length > 0 && c.length < 50))
		.$;
	if (pollErr) return rej('invalid poll');

	if (poll) {
		(poll as any).choices = (poll as any).choices.map((choice, i) => ({
			id: i, // IDを付与
			text: choice.trim(),
			votes: 0
		}));
	}

	// テキストが無いかつ添付ファイルが無いかつRenoteも無いかつ投票も無かったらエラー
	if (text === undefined && files === null && renote === null && poll === undefined) {
		return rej('text, mediaIds, renoteId or poll is required');
	}

	// 投稿を作成
	const note = await create(user, {
		createdAt: new Date(),
		media: files,
		poll,
		text,
		reply,
		renote,
		cw,
		tags,
		app,
		viaMobile,
		visibility,
		geo
	});

	const noteObj = await pack(note, user);

	// Reponse
	res({
		createdNote: noteObj
	});
});
