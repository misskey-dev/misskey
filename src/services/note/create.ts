import Note, { pack, INote } from '../../models/note';
import User, { isLocalUser, IUser, isRemoteUser } from '../../models/user';
import stream from '../../publishers/stream';
import Following from '../../models/following';
import { deliver } from '../../queue';
import renderNote from '../../remote/activitypub/renderer/note';
import renderCreate from '../../remote/activitypub/renderer/create';
import context from '../../remote/activitypub/renderer/context';
import { IDriveFile } from '../../models/drive-file';
import notify from '../../publishers/notify';
import NoteWatching from '../../models/note-watching';
import watch from './watch';
import Mute from '../../models/mute';
import pushSw from '../../publishers/push-sw';
import event from '../../publishers/stream';
import parse from '../../text/parse';
import html from '../../text/html';
import { IApp } from '../../models/app';

export default async (user: IUser, data: {
	createdAt?: Date;
	text?: string;
	reply?: INote;
	renote?: INote;
	media?: IDriveFile[];
	geo?: any;
	poll?: any;
	viaMobile?: boolean;
	tags?: string[];
	cw?: string;
	visibility?: string;
	uri?: string;
	app?: IApp;
}, silent = false) => new Promise<INote>(async (res, rej) => {
	if (data.createdAt == null) data.createdAt = new Date();
	if (data.visibility == null) data.visibility = 'public';

	const tags = data.tags || [];

	let tokens = null;

	if (data.text) {
		// Analyze
		tokens = parse(data.text);

		// Extract hashtags
		const hashtags = tokens
			.filter(t => t.type == 'hashtag')
			.map(t => t.hashtag);

		hashtags.forEach(tag => {
			if (tags.indexOf(tag) == -1) {
				tags.push(tag);
			}
		});
	}

	const insert: any = {
		createdAt: data.createdAt,
		mediaIds: data.media ? data.media.map(file => file._id) : [],
		replyId: data.reply ? data.reply._id : null,
		renoteId: data.renote ? data.renote._id : null,
		text: data.text,
		textHtml: tokens === null ? null : html(tokens),
		poll: data.poll,
		cw: data.cw,
		tags,
		userId: user._id,
		viaMobile: data.viaMobile,
		geo: data.geo || null,
		appId: data.app ? data.app._id : null,
		visibility: data.visibility,

		// 以下非正規化データ
		_reply: data.reply ? { userId: data.reply.userId } : null,
		_renote: data.renote ? { userId: data.renote.userId } : null,
		_user: {
			host: user.host,
			hostLower: user.hostLower,
			account: isLocalUser(user) ? {} : {
				inbox: user.account.inbox
			}
		}
	};

	if (data.uri != null) insert.uri = data.uri;

	// 投稿を作成
	const note = await Note.insert(insert);

	res(note);

	User.update({ _id: user._id }, {
		// Increment notes count
		$inc: {
			notesCount: 1
		},
		// Update latest note
		$set: {
			latestNote: note
		}
	});

	// Serialize
	const noteObj = await pack(note);

	// タイムラインへの投稿
	if (note.channelId == null) {
		// Publish event to myself's stream
		if (isLocalUser(user)) {
			stream(note.userId, 'note', noteObj);
		}

		// Fetch all followers
		const followers = await Following.aggregate([{
			$lookup: {
				from: 'users',
				localField: 'followerId',
				foreignField: '_id',
				as: 'user'
			}
		}, {
			$match: {
				followeeId: note.userId
			}
		}], {
			_id: false
		});

		if (!silent) {
			const content = renderCreate(await renderNote(user, note));
			content['@context'] = context;

			// 投稿がリプライかつ投稿者がローカルユーザーかつリプライ先の投稿の投稿者がリモートユーザーなら配送
			if (data.reply && isLocalUser(user) && isRemoteUser(data.reply._user)) {
				deliver(user, content, data.reply._user.account.inbox).save();
			}

			Promise.all(followers.map(follower => {
				follower = follower.user[0];

				if (isLocalUser(follower)) {
					// Publish event to followers stream
					stream(follower._id, 'note', noteObj);
				} else {
					// フォロワーがリモートユーザーかつ投稿者がローカルユーザーなら投稿を配信
					if (isLocalUser(user)) {
						deliver(user, content, follower.account.inbox).save();
					}
				}
			}));
		}
	}

	// チャンネルへの投稿
	/* TODO
	if (note.channelId) {
		promises.push(
			// Increment channel index(notes count)
			Channel.update({ _id: note.channelId }, {
				$inc: {
					index: 1
				}
			}),

			// Publish event to channel
			promisedNoteObj.then(noteObj => {
				publishChannelStream(note.channelId, 'note', noteObj);
			}),

			Promise.all([
				promisedNoteObj,

				// Get channel watchers
				ChannelWatching.find({
					channelId: note.channelId,
					// 削除されたドキュメントは除く
					deletedAt: { $exists: false }
				})
			]).then(([noteObj, watches]) => {
				// チャンネルの視聴者(のタイムライン)に配信
				watches.forEach(w => {
					stream(w.userId, 'note', noteObj);
				});
			})
		);
	}*/

	const mentions = [];

	async function addMention(mentionee, reason) {
		// Reject if already added
		if (mentions.some(x => x.equals(mentionee))) return;

		// Add mention
		mentions.push(mentionee);

		// Publish event
		if (!user._id.equals(mentionee)) {
			const mentioneeMutes = await Mute.find({
				muter_id: mentionee,
				deleted_at: { $exists: false }
			});
			const mentioneesMutedUserIds = mentioneeMutes.map(m => m.muteeId.toString());
			if (mentioneesMutedUserIds.indexOf(user._id.toString()) == -1) {
				event(mentionee, reason, noteObj);
				pushSw(mentionee, reason, noteObj);
			}
		}
	}

	// If has in reply to note
	if (data.reply) {
		// Increment replies count
		Note.update({ _id: data.reply._id }, {
			$inc: {
				repliesCount: 1
			}
		});

		// (自分自身へのリプライでない限りは)通知を作成
		notify(data.reply.userId, user._id, 'reply', {
			noteId: note._id
		});

		// Fetch watchers
		NoteWatching.find({
			noteId: data.reply._id,
			userId: { $ne: user._id },
			// 削除されたドキュメントは除く
			deletedAt: { $exists: false }
		}, {
			fields: {
				userId: true
			}
		}).then(watchers => {
			watchers.forEach(watcher => {
				notify(watcher.userId, user._id, 'reply', {
					noteId: note._id
				});
			});
		});

		// この投稿をWatchする
		if (isLocalUser(user) && user.account.settings.autoWatch !== false) {
			watch(user._id, data.reply);
		}

		// Add mention
		addMention(data.reply.userId, 'reply');
	}

	// If it is renote
	if (data.renote) {
		// Notify
		const type = data.text ? 'quote' : 'renote';
		notify(data.renote.userId, user._id, type, {
			note_id: note._id
		});

		// Fetch watchers
		NoteWatching.find({
			noteId: data.renote._id,
			userId: { $ne: user._id },
			// 削除されたドキュメントは除く
			deletedAt: { $exists: false }
		}, {
			fields: {
				userId: true
			}
		}).then(watchers => {
			watchers.forEach(watcher => {
				notify(watcher.userId, user._id, type, {
					noteId: note._id
				});
			});
		});

		// この投稿をWatchする
		if (isLocalUser(user) && user.account.settings.autoWatch !== false) {
			watch(user._id, data.renote);
		}

		// If it is quote renote
		if (data.text) {
			// Add mention
			addMention(data.renote.userId, 'quote');
		} else {
			// Publish event
			if (!user._id.equals(data.renote.userId)) {
				event(data.renote.userId, 'renote', noteObj);
			}
		}

		// 今までで同じ投稿をRenoteしているか
		const existRenote = await Note.findOne({
			userId: user._id,
			renoteId: data.renote._id,
			_id: {
				$ne: note._id
			}
		});

		if (!existRenote) {
			// Update renoteee status
			Note.update({ _id: data.renote._id }, {
				$inc: {
					renoteCount: 1
				}
			});
		}
	}

	// If has text content
	if (data.text) {
		// Extract an '@' mentions
		const atMentions = tokens
			.filter(t => t.type == 'mention')
			.map(m => m.username)
			// Drop dupulicates
			.filter((v, i, s) => s.indexOf(v) == i);

		// Resolve all mentions
		await Promise.all(atMentions.map(async mention => {
			// Fetch mentioned user
			// SELECT _id
			const mentionee = await User
				.findOne({
					usernameLower: mention.toLowerCase()
				}, { _id: true });

			// When mentioned user not found
			if (mentionee == null) return;

			// 既に言及されたユーザーに対する返信や引用renoteの場合も無視
			if (data.reply && data.reply.userId.equals(mentionee._id)) return;
			if (data.renote && data.renote.userId.equals(mentionee._id)) return;

			// Add mention
			addMention(mentionee._id, 'mention');

			// Create notification
			notify(mentionee._id, user._id, 'mention', {
				note_id: note._id
			});
		}));
	}

	// Append mentions data
	if (mentions.length > 0) {
		Note.update({ _id: note._id }, {
			$set: {
				mentions
			}
		});
	}
});
