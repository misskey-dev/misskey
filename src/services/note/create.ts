import Note, { pack, INote } from '../../models/note';
import User, { isLocalUser, IUser, isRemoteUser, IRemoteUser, ILocalUser } from '../../models/user';
import stream, { publishLocalTimelineStream, publishGlobalTimelineStream, publishUserListStream } from '../../publishers/stream';
import Following from '../../models/following';
import { deliver } from '../../queue';
import renderNote from '../../remote/activitypub/renderer/note';
import renderCreate from '../../remote/activitypub/renderer/create';
import renderAnnounce from '../../remote/activitypub/renderer/announce';
import packAp from '../../remote/activitypub/renderer';
import { IDriveFile } from '../../models/drive-file';
import notify from '../../publishers/notify';
import NoteWatching from '../../models/note-watching';
import watch from './watch';
import Mute from '../../models/mute';
import pushSw from '../../publishers/push-sw';
import event from '../../publishers/stream';
import parse from '../../text/parse';
import { IApp } from '../../models/app';
import UserList from '../../models/user-list';
import resolveUser from '../../remote/resolve-user';

type Reason = 'reply' | 'quote' | 'mention';

/**
 * ServiceWorkerへの通知を担当
 */
class NotificationManager {
	private user: IUser;
	private note: any;
	private list: Array<{
		user: ILocalUser['_id'],
		reason: Reason;
	}> = [];

	constructor(user, note) {
		this.user = user;
		this.note = note;
	}

	public push(user: ILocalUser['_id'], reason: Reason) {
		// 自分自身へは通知しない
		if (this.user._id.equals(user)) return;

		const exist = this.list.find(x => x.user.equals(user));

		if (exist) {
			// 「メンションされているかつ返信されている」場合は、メンションとしての通知ではなく返信としての通知にする
			if (reason != 'mention') {
				exist.reason = reason;
			}
		} else {
			this.list.push({
				user, reason
			});
		}
	}

	public deliver() {
		this.list.forEach(async x => {
			const mentionee = x.user;

			// ミュート情報を取得
			const mentioneeMutes = await Mute.find({
				muterId: mentionee
			});

			const mentioneesMutedUserIds = mentioneeMutes.map(m => m.muteeId.toString());

			// 通知される側のユーザーが通知する側のユーザーをミュートしていない限りは通知する
			if (!mentioneesMutedUserIds.includes(this.user._id.toString())) {
				pushSw(mentionee, x.reason, this.note);
			}
		});
	}
}

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
	visibleUsers?: IUser[];
	uri?: string;
	app?: IApp;
}, silent = false) => new Promise<INote>(async (res, rej) => {
	if (data.createdAt == null) data.createdAt = new Date();
	if (data.visibility == null) data.visibility = 'public';
	if (data.viaMobile == null) data.viaMobile = false;

	const tags = data.tags || [];

	let tokens: any[] = null;

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

	if (data.visibleUsers) {
		data.visibleUsers = data.visibleUsers.filter(x => x != null);
	}

	const insert: any = {
		createdAt: data.createdAt,
		mediaIds: data.media ? data.media.map(file => file._id) : [],
		replyId: data.reply ? data.reply._id : null,
		renoteId: data.renote ? data.renote._id : null,
		text: data.text,
		poll: data.poll,
		cw: data.cw == null ? null : data.cw,
		tags,
		userId: user._id,
		viaMobile: data.viaMobile,
		geo: data.geo || null,
		appId: data.app ? data.app._id : null,
		visibility: data.visibility,
		visibleUserIds: data.visibility == 'specified'
			? data.visibleUsers
				? data.visibleUsers.map(u => u._id)
				: []
			: [],

		// 以下非正規化データ
		_reply: data.reply ? { userId: data.reply.userId } : null,
		_renote: data.renote ? { userId: data.renote.userId } : null,
		_user: {
			host: user.host,
			inbox: isRemoteUser(user) ? user.inbox : undefined
		}
	};

	if (data.uri != null) insert.uri = data.uri;

	// 投稿を作成
	let note: INote;
	try {
		note = await Note.insert(insert);
	} catch (e) {
		// duplicate key error
		if (e.code === 11000) {
			return res(null);
		}

		console.error(e);
		return rej('something happened');
	}

	res(note);

	// Increment notes count
	User.update({ _id: user._id }, {
		$inc: {
			notesCount: 1
		}
	});

	if (data.reply) {
		Note.update({ _id: data.reply._id }, {
			$push: {
				_replyIds: note._id
			}
		});
	}

	const isQuote = data.renote && (data.text || data.poll || data.media);

	if (isQuote) {
		Note.update({ _id: data.renote._id }, {
			$push: {
				_quoteIds: note._id
			}
		});
	}

	// Serialize
	const noteObj = await pack(note);

	const nm = new NotificationManager(user, noteObj);

	const render = async () => {
		const content = data.renote && data.text == null
			? renderAnnounce(data.renote.uri ? data.renote.uri : await renderNote(data.renote))
			: renderCreate(await renderNote(note));
		return packAp(content);
	};

	if (!silent) {
		if (isLocalUser(user)) {
			if (note.visibility == 'private' || note.visibility == 'followers' || note.visibility == 'specified') {
				// Publish event to myself's stream
				stream(note.userId, 'note', await pack(note, user, {
					detail: true
				}));
			} else {
				// Publish event to myself's stream
				stream(note.userId, 'note', noteObj);

				// Publish note to local timeline stream
				if (note.visibility != 'home') {
					publishLocalTimelineStream(noteObj);
				}
			}
		}

		// Publish note to global timeline stream
		if (note.visibility == 'public' && note.replyId == null) {
			publishGlobalTimelineStream(noteObj);
		}

		if (note.visibility == 'specified') {
			data.visibleUsers.forEach(async u => {
				stream(u._id, 'note', await pack(note, u, {
					detail: true
				}));
			});
		}

		if (note.visibility == 'public' || note.visibility == 'home' || note.visibility == 'followers') {
			// フォロワーに配信
			Following.find({
				followeeId: note.userId
			}).then(followers => {
				followers.map(async following => {
					const follower = following._follower;

					if (isLocalUser(follower)) {
						// ストーキングしていない場合
						if (!following.stalk) {
							// この投稿が返信ならスキップ
							if (note.replyId && !note._reply.userId.equals(following.followerId) && !note._reply.userId.equals(note.userId)) return;
						}

						// Publish event to followers stream
						stream(following.followerId, 'note', noteObj);
					} else {
						//#region AP配送
						// フォロワーがリモートユーザーかつ投稿者がローカルユーザーなら投稿を配信
						if (isLocalUser(user)) {
							deliver(user, await render(), follower.inbox);
						}
						//#endergion
					}
				});
			});
		}

		// リストに配信
		UserList.find({
			userIds: note.userId
		}).then(lists => {
			lists.forEach(list => {
				publishUserListStream(list._id, 'note', noteObj);
			});
		});
	}

	//#region リプライとAnnounceのAP配送

	// 投稿がリプライかつ投稿者がローカルユーザーかつリプライ先の投稿の投稿者がリモートユーザーなら配送
	if (data.reply && isLocalUser(user) && isRemoteUser(data.reply._user)) {
		deliver(user, await render(), data.reply._user.inbox);
	}

	// 投稿がRenoteかつ投稿者がローカルユーザーかつRenote元の投稿の投稿者がリモートユーザーなら配送
	if (data.renote && isLocalUser(user) && isRemoteUser(data.renote._user)) {
		deliver(user, await render(), data.renote._user.inbox);
	}
	//#endergion

	//#region メンション
	if (data.text) {
		// TODO: Drop dupulicates
		const mentions = tokens
			.filter(t => t.type == 'mention');

		let mentionedUsers = await Promise.all(mentions.map(async m => {
			try {
				return await resolveUser(m.username, m.host);
			} catch (e) {
				return null;
			}
		}));

		// TODO: Drop dupulicates
		mentionedUsers = mentionedUsers.filter(x => x != null);

		mentionedUsers.filter(u => isLocalUser(u)).forEach(async u => {
			event(u, 'mention', noteObj);

			// 既に言及されたユーザーに対する返信や引用renoteの場合も無視
			if (data.reply && data.reply.userId.equals(u._id)) return;
			if (data.renote && data.renote.userId.equals(u._id)) return;

			// Create notification
			notify(u._id, user._id, 'mention', {
				noteId: note._id
			});

			nm.push(u._id, 'mention');
		});

		if (isLocalUser(user)) {
			mentionedUsers.filter(u => isRemoteUser(u)).forEach(async u => {
				deliver(user, await render(), (u as IRemoteUser).inbox);
			});
		}

		// Append mentions data
		if (mentionedUsers.length > 0) {
			Note.update({ _id: note._id }, {
				$set: {
					mentions: mentionedUsers.map(u => u._id)
				}
			});
		}
	}
	//#endregion

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
		if (isLocalUser(user) && user.settings.autoWatch !== false) {
			watch(user._id, data.reply);
		}

		nm.push(data.reply.userId, 'reply');
	}

	// If it is renote
	if (data.renote) {
		// Notify
		const type = data.text ? 'quote' : 'renote';
		notify(data.renote.userId, user._id, type, {
			noteId: note._id
		});

		// Fetch watchers
		NoteWatching.find({
			noteId: data.renote._id,
			userId: { $ne: user._id }
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
		if (isLocalUser(user) && user.settings.autoWatch !== false) {
			watch(user._id, data.renote);
		}

		// If it is quote renote
		if (data.text) {
			// Add mention
			nm.push(data.renote.userId, 'quote');
		} else {
			// Publish event
			if (!user._id.equals(data.renote.userId)) {
				event(data.renote.userId, 'renote', noteObj);
			}
		}

		//#region TODO: これ重い
		// 今までで同じ投稿をRenoteしているか
		//const existRenote = await Note.findOne({
		//	userId: user._id,
		//	renoteId: data.renote._id,
		//	_id: {
		//		$ne: note._id
		//	}
		//});
		const existRenote = null;
		//#endregion

		if (!existRenote) {
			// Update renoteee status
			Note.update({ _id: data.renote._id }, {
				$inc: {
					renoteCount: 1
				}
			});
		}
	}
});
