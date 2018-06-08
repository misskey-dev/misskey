/**
 * Module dependencies
 */
import $ from 'cafy'; import ID from '../../../../cafy-id';
import Note, { INote, isValidText, isValidCw, pack } from '../../../../models/note';
import User, { ILocalUser } from '../../../../models/user';
import DriveFile from '../../../../models/drive-file';
import create from '../../../../services/note/create';
import { IApp } from '../../../../models/app';

/**
 * Create a note
 */
module.exports = (params, user: ILocalUser, app: IApp) => new Promise(async (res, rej) => {
	// Get 'visibility' parameter
	const [visibility = 'public', visibilityErr] = $.str.optional().or(['public', 'home', 'followers', 'specified', 'private']).get(params.visibility);
	if (visibilityErr) return rej('invalid visibility');

	// Get 'visibleUserIds' parameter
	const [visibleUserIds, visibleUserIdsErr] = $.arr($.type(ID)).optional().unique().min(1).get(params.visibleUserIds);
	if (visibleUserIdsErr) return rej('invalid visibleUserIds');

	let visibleUsers = [];
	if (visibleUserIds !== undefined) {
		visibleUsers = await Promise.all(visibleUserIds.map(id => User.findOne({
			_id: id
		})));
	}

	// Get 'text' parameter
	const [text = null, textErr] = $.str.optional().nullable().pipe(isValidText).get(params.text);
	if (textErr) return rej('invalid text');

	// Get 'cw' parameter
	const [cw, cwErr] = $.str.optional().nullable().pipe(isValidCw).get(params.cw);
	if (cwErr) return rej('invalid cw');

	// Get 'viaMobile' parameter
	const [viaMobile = false, viaMobileErr] = $.bool.optional().get(params.viaMobile);
	if (viaMobileErr) return rej('invalid viaMobile');

	// Get 'tags' parameter
	const [tags = [], tagsErr] = $.arr($.str.range(1, 32)).optional().unique().get(params.tags);
	if (tagsErr) return rej('invalid tags');

	// Get 'geo' parameter
	const [geo, geoErr] = $.obj.optional().nullable().strict()
		.have('coordinates', $.arr().length(2)
			.item(0, $.num.range(-180, 180))
			.item(1, $.num.range(-90, 90)))
		.have('altitude', $.num.nullable())
		.have('accuracy', $.num.nullable())
		.have('altitudeAccuracy', $.num.nullable())
		.have('heading', $.num.nullable().range(0, 360))
		.have('speed', $.num.nullable())
		.get(params.geo);
	if (geoErr) return rej('invalid geo');

	// Get 'mediaIds' parameter
	const [mediaIds, mediaIdsErr] = $.arr($.type(ID)).optional().unique().range(1, 4).get(params.mediaIds);
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
	const [renoteId, renoteIdErr] = $.type(ID).optional().get(params.renoteId);
	if (renoteIdErr) return rej('invalid renoteId');

	let renote: INote = null;
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
	}

	// Get 'replyId' parameter
	const [replyId, replyIdErr] = $.type(ID).optional().get(params.replyId);
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

	// Get 'poll' parameter
	const [poll, pollErr] = $.obj.optional().strict()
		.have('choices', $.arr($.str)
			.unique()
			.range(2, 10)
			.each(c => c.length > 0 && c.length < 50))
		.get(params.poll);
	if (pollErr) return rej('invalid poll');

	if (poll) {
		(poll as any).choices = (poll as any).choices.map((choice, i) => ({
			id: i, // IDを付与
			text: choice.trim(),
			votes: 0
		}));
	}

	// テキストが無いかつ添付ファイルが無いかつRenoteも無いかつ投票も無かったらエラー
	if ((text === undefined || text === null) && files === null && renote === null && poll === undefined) {
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
		visibleUsers,
		geo
	});

	const noteObj = await pack(note, user);

	// Reponse
	res({
		createdNote: noteObj
	});
});
