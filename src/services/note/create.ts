import es from '../../db/elasticsearch';
import Note, { pack, INote, IChoice } from '../../models/note';
import User, { isLocalUser, IUser, isRemoteUser, IRemoteUser, ILocalUser } from '../../models/user';
import { publishMainStream, publishHomeTimelineStream, publishLocalTimelineStream, publishHybridTimelineStream, publishGlobalTimelineStream, publishUserListStream, publishHashtagStream } from '../stream';
import Following from '../../models/following';
import { deliver } from '../../queue';
import renderNote from '../../remote/activitypub/renderer/note';
import renderCreate from '../../remote/activitypub/renderer/create';
import renderAnnounce from '../../remote/activitypub/renderer/announce';
import { renderActivity } from '../../remote/activitypub/renderer';
import DriveFile, { IDriveFile } from '../../models/drive-file';
import notify from '../../services/create-notification';
import NoteWatching from '../../models/note-watching';
import watch from './watch';
import Mute from '../../models/mute';
import { parse } from '../../mfm/parse';
import { IApp } from '../../models/app';
import UserList from '../../models/user-list';
import resolveUser from '../../remote/resolve-user';
import Meta from '../../models/meta';
import config from '../../config';
import { updateHashtag } from '../update-hashtag';
import isQuote from '../../misc/is-quote';
import notesChart from '../../services/chart/notes';
import perUserNotesChart from '../../services/chart/per-user-notes';
import activeUsersChart from '../../services/chart/active-users';
import instanceChart from '../../services/chart/instance';
import * as deepcopy from 'deepcopy';

import { erase, concat } from '../../prelude/array';
import insertNoteUnread from './unread';
import { registerOrFetchInstanceDoc } from '../register-or-fetch-instance-doc';
import Instance from '../../models/instance';
import extractMentions from '../../misc/extract-mentions';
import extractEmojis from '../../misc/extract-emojis';
import extractHashtags from '../../misc/extract-hashtags';

type NotificationType = 'reply' | 'renote' | 'quote' | 'mention';

class NotificationManager {
	private notifier: IUser;
	private note: INote;
	private queue: {
		target: ILocalUser['_id'];
		reason: NotificationType;
	}[];

	constructor(notifier: IUser, note: INote) {
		this.notifier = notifier;
		this.note = note;
		this.queue = [];
	}

	public push(notifiee: ILocalUser['_id'], reason: NotificationType) {
		// 自分自身へは通知しない
		if (this.notifier._id.equals(notifiee)) return;

		const exist = this.queue.find(x => x.target.equals(notifiee));

		if (exist) {
			// 「メンションされているかつ返信されている」場合は、メンションとしての通知ではなく返信としての通知にする
			if (reason != 'mention') {
				exist.reason = reason;
			}
		} else {
			this.queue.push({
				reason: reason,
				target: notifiee
			});
		}
	}

	public async deliver() {
		for (const x of this.queue) {
			// ミュート情報を取得
			const mentioneeMutes = await Mute.find({
				muterId: x.target
			});

			const mentioneesMutedUserIds = mentioneeMutes.map(m => m.muteeId.toString());

			// 通知される側のユーザーが通知する側のユーザーをミュートしていない限りは通知する
			if (!mentioneesMutedUserIds.includes(this.notifier._id.toString())) {
				notify(x.target, this.notifier._id, x.reason, {
					noteId: this.note._id
				});
			}
		}
	}
}

type Option = {
	createdAt?: Date;
	text?: string;
	reply?: INote;
	renote?: INote;
	files?: IDriveFile[];
	geo?: any;
	poll?: any;
	viaMobile?: boolean;
	localOnly?: boolean;
	cw?: string;
	visibility?: string;
	visibleUsers?: IUser[];
	apMentions?: IUser[];
	apHashtags?: string[];
	apEmojis?: string[];
	questionUri?: string;
	uri?: string;
	app?: IApp;
	voting?: boolean;
};

export default async (user: IUser, data: Option, silent = false) => new Promise<INote>(async (res, rej) => {
	const isFirstNote = user.notesCount === 0;

	if (data.createdAt == null) data.createdAt = new Date();
	if (data.visibility == null) data.visibility = 'public';
	if (data.viaMobile == null) data.viaMobile = false;
	if (data.localOnly == null) data.localOnly = false;

	// サイレンス
	if (user.isSilenced && data.visibility == 'public') {
		data.visibility = 'home';
	}

	if (data.visibleUsers) {
		data.visibleUsers = erase(null, data.visibleUsers);
	}

	// リプライ対象が削除された投稿だったらreject
	if (data.reply && data.reply.deletedAt != null) {
		return rej('Reply target has been deleted');
	}

	// Renote対象が削除された投稿だったらreject
	if (data.renote && data.renote.deletedAt != null) {
		return rej('Renote target has been deleted');
	}

	// Renote対象が「ホームまたは全体」以外の公開範囲ならreject
	if (data.renote && data.renote.visibility != 'public' && data.renote.visibility != 'home') {
		return rej('Renote target is not public or home');
	}

	// Renote対象がpublicではないならhomeにする
	if (data.renote && data.renote.visibility != 'public' && data.visibility == 'public') {
		data.visibility = 'home';
	}

	// 返信対象がpublicではないならhomeにする
	if (data.reply && data.reply.visibility != 'public' && data.visibility == 'public') {
		data.visibility = 'home';
	}

	// ローカルのみをRenoteしたらローカルのみにする
	if (data.renote && data.renote.localOnly) {
		data.localOnly = true;
	}

	// ローカルのみにリプライしたらローカルのみにする
	if (data.reply && data.reply.localOnly) {
		data.localOnly = true;
	}

	if (data.text) {
		data.text = data.text.trim();
	}

	let tags = data.apHashtags;
	let emojis = data.apEmojis;
	let mentionedUsers = data.apMentions;

	// Parse MFM if needed
	if (!tags || !emojis || !mentionedUsers) {
		const tokens = data.text ? parse(data.text) : [];
		const cwTokens = data.cw ? parse(data.cw) : [];
		const choiceTokens = data.poll && data.poll.choices
			? concat((data.poll.choices as IChoice[]).map(choice => parse(choice.text)))
			: [];

		const combinedTokens = tokens.concat(cwTokens).concat(choiceTokens);

		tags = data.apHashtags || extractHashtags(combinedTokens);

		emojis = data.apEmojis || extractEmojis(combinedTokens);

		mentionedUsers = data.apMentions || await extractMentionedUsers(user, combinedTokens);
	}

	// MongoDBのインデックス対象は128文字以上にできない
	tags = tags.filter(tag => tag.length <= 100);

	if (data.reply && !user._id.equals(data.reply.userId) && !mentionedUsers.some(u => u._id.equals(data.reply.userId))) {
		mentionedUsers.push(await User.findOne({ _id: data.reply.userId }));
	}

	if (data.visibility == 'specified') {
		for (const u of data.visibleUsers) {
			if (!mentionedUsers.some(x => x._id.equals(u._id))) {
				mentionedUsers.push(u);
			}
		}

		for (const u of mentionedUsers) {
			if (!data.visibleUsers.some(x => x._id.equals(u._id))) {
				data.visibleUsers.push(u);
			}
		}
	}

	const note = await insertNote(user, data, tags, emojis, mentionedUsers);

	res(note);

	if (note == null) {
		return;
	}

	// 統計を更新
	notesChart.update(note, true);
	perUserNotesChart.update(user, note, true);
	// ローカルユーザーのチャートはタイムライン取得時に更新しているのでリモートユーザーの場合だけでよい
	if (isRemoteUser(user)) activeUsersChart.update(user);

	// Register host
	if (isRemoteUser(user)) {
		registerOrFetchInstanceDoc(user.host).then(i => {
			Instance.update({ _id: i._id }, {
				$inc: {
					notesCount: 1
				}
			});

			instanceChart.updateNote(i.host, true);
		});
	}

	// ハッシュタグ更新
	for (const tag of tags) updateHashtag(user, tag);

	// ファイルが添付されていた場合ドライブのファイルの「このファイルが添付された投稿一覧」プロパティにこの投稿を追加
	if (data.files) {
		for (const file of data.files) {
			DriveFile.update({ _id: file._id }, {
				$push: {
					'metadata.attachedNoteIds': note._id
				}
			});
		}
	}

	// Increment notes count
	incNotesCount(user);

	// Increment notes count (user)
	incNotesCountOfUser(user);

	// 未読通知を作成
	if (data.visibility == 'specified') {
		for (const u of data.visibleUsers) {
			insertNoteUnread(u, note, true);
		}
	} else {
		for (const u of mentionedUsers) {
			insertNoteUnread(u, note, false);
		}
	}

	if (data.reply) {
		saveReply(data.reply, note);
	}

	if (data.renote) {
		incRenoteCount(data.renote);
	}

	if (isQuote(note)) {
		saveQuote(data.renote, note);
	}

	// Pack the note
	const noteObj = await pack(note);

	if (isFirstNote) {
		noteObj.isFirstNote = true;
	}

	if (tags.length > 0) {
		publishHashtagStream(noteObj);
	}

	const nm = new NotificationManager(user, note);
	const nmRelatedPromises = [];

	createMentionedEvents(mentionedUsers, note, nm);

	const noteActivity = await renderNoteOrRenoteActivity(data, note);

	if (isLocalUser(user)) {
		deliverNoteToMentionedRemoteUsers(mentionedUsers, user, noteActivity);
	}

	// If has in reply to note
	if (data.reply) {
		// Fetch watchers
		nmRelatedPromises.push(notifyToWatchersOfReplyee(data.reply, user, nm));

		// この投稿をWatchする
		if (isLocalUser(user) && user.settings.autoWatch !== false) {
			watch(user._id, data.reply);
		}

		// 通知
		if (isLocalUser(data.reply._user)) {
			nm.push(data.reply.userId, 'reply');
			publishMainStream(data.reply.userId, 'reply', noteObj);
		}
	}

	// If it is renote
	if (data.renote) {
		const type = data.text ? 'quote' : 'renote';

		// Notify
		if (isLocalUser(data.renote._user)) {
			nm.push(data.renote.userId, type);
		}

		// Fetch watchers
		nmRelatedPromises.push(notifyToWatchersOfRenotee(data.renote, user, nm, type));

		// この投稿をWatchする
		if (isLocalUser(user) && user.settings.autoWatch !== false) {
			watch(user._id, data.renote);
		}

		// Publish event
		if (!user._id.equals(data.renote.userId) && isLocalUser(data.renote._user)) {
			publishMainStream(data.renote.userId, 'renote', noteObj);
		}
	}

	if (!silent) {
		publish(user, note, noteObj, data.reply, data.renote, data.visibleUsers, noteActivity);
	}

	Promise.all(nmRelatedPromises).then(() => {
		nm.deliver();
	});

	// Register to search database
	index(note);
});

async function renderNoteOrRenoteActivity(data: Option, note: INote) {
	if (data.localOnly) return null;

	const content = data.renote && data.text == null && data.poll == null && (data.files == null || data.files.length == 0)
		? renderAnnounce(data.renote.uri ? data.renote.uri : `${config.url}/notes/${data.renote._id}`, note)
		: renderCreate(await renderNote(note, false), note);

	return renderActivity(content);
}

function incRenoteCount(renote: INote) {
	Note.update({ _id: renote._id }, {
		$inc: {
			renoteCount: 1,
			score: 1
		}
	});
}

async function publish(user: IUser, note: INote, noteObj: any, reply: INote, renote: INote, visibleUsers: IUser[], noteActivity: any) {
	if (isLocalUser(user)) {
		// 投稿がリプライかつ投稿者がローカルユーザーかつリプライ先の投稿の投稿者がリモートユーザーなら配送
		if (reply && isRemoteUser(reply._user)) {
			deliver(user, noteActivity, reply._user.inbox);
		}

		// 投稿がRenoteかつ投稿者がローカルユーザーかつRenote元の投稿の投稿者がリモートユーザーなら配送
		if (renote && isRemoteUser(renote._user)) {
			deliver(user, noteActivity, renote._user.inbox);
		}

		if (['followers', 'specified'].includes(note.visibility)) {
			const detailPackedNote = await pack(note, user, {
				detail: true
			});
			// Publish event to myself's stream
			publishHomeTimelineStream(note.userId, detailPackedNote);
			publishHybridTimelineStream(note.userId, detailPackedNote);

			if (note.visibility == 'specified') {
				for (const u of visibleUsers) {
					if (!u._id.equals(user._id)) {
						publishHomeTimelineStream(u._id, detailPackedNote);
						publishHybridTimelineStream(u._id, detailPackedNote);
					}
				}
			}
		} else {
			// Publish event to myself's stream
			publishHomeTimelineStream(note.userId, noteObj);

			// Publish note to local and hybrid timeline stream
			if (note.visibility != 'home') {
				publishLocalTimelineStream(noteObj);
			}

			if (note.visibility == 'public') {
				publishHybridTimelineStream(null, noteObj);
			} else {
				// Publish event to myself's stream
				publishHybridTimelineStream(note.userId, noteObj);
			}
		}
	}

	// Publish note to global timeline stream
	if (note.visibility == 'public' && note.replyId == null) {
		publishGlobalTimelineStream(noteObj);
	}

	if (['public', 'home', 'followers'].includes(note.visibility)) {
		// フォロワーに配信
		publishToFollowers(note, user, noteActivity);
	}

	// リストに配信
	publishToUserLists(note, noteObj);
}

async function insertNote(user: IUser, data: Option, tags: string[], emojis: string[], mentionedUsers: IUser[]) {
	const insert: any = {
		createdAt: data.createdAt,
		fileIds: data.files ? data.files.map(file => file._id) : [],
		replyId: data.reply ? data.reply._id : null,
		renoteId: data.renote ? data.renote._id : null,
		text: data.text,
		poll: data.poll,
		cw: data.cw == null ? null : data.cw,
		tags,
		tagsLower: tags.map(tag => tag.toLowerCase()),
		emojis,
		userId: user._id,
		viaMobile: data.viaMobile,
		localOnly: data.localOnly,
		geo: data.geo || null,
		appId: data.app ? data.app._id : null,
		visibility: data.visibility,
		visibleUserIds: data.visibility == 'specified'
			? data.visibleUsers
				? data.visibleUsers.map(u => u._id)
				: []
			: [],
		voting: data.voting || false,

		// 以下非正規化データ
		_reply: data.reply ? {
			userId: data.reply.userId,
			user: {
				host: data.reply._user.host
			}
		} : null,
		_renote: data.renote ? {
			userId: data.renote.userId,
			user: {
				host: data.renote._user.host
			}
		} : null,
		_user: {
			host: user.host,
			inbox: isRemoteUser(user) ? user.inbox : undefined
		},
		_files: data.files ? data.files : []
	};

	if (data.uri != null) insert.uri = data.uri;

	// Append mentions data
	if (mentionedUsers.length > 0) {
		insert.mentions = mentionedUsers.map(u => u._id);
		insert.mentionedRemoteUsers = mentionedUsers.filter(u => isRemoteUser(u)).map(u => ({
			uri: (u as IRemoteUser).uri,
			username: u.username,
			host: u.host
		}));
	}

	// 投稿を作成
	try {
		return await Note.insert(insert);
	} catch (e) {
		// duplicate key error
		if (e.code === 11000) {
			return null;
		}

		throw 'something happened';
	}
}

function index(note: INote) {
	if (note.text == null || config.elasticsearch == null) return;

	es.index({
		index: 'misskey',
		type: 'note',
		id: note._id.toString(),
		body: {
			text: note.text
		}
	});
}

async function notifyToWatchersOfRenotee(renote: INote, user: IUser, nm: NotificationManager, type: NotificationType) {
	const watchers = await NoteWatching.find({
		noteId: renote._id,
		userId: { $ne: user._id }
	}, {
			fields: {
				userId: true
			}
		});

	for (const watcher of watchers) {
		nm.push(watcher.userId, type);
	}
}

async function notifyToWatchersOfReplyee(reply: INote, user: IUser, nm: NotificationManager) {
	const watchers = await NoteWatching.find({
		noteId: reply._id,
		userId: { $ne: user._id }
	}, {
			fields: {
				userId: true
			}
		});

	for (const watcher of watchers) {
		nm.push(watcher.userId, 'reply');
	}
}

async function publishToUserLists(note: INote, noteObj: any) {
	const lists = await UserList.find({
		userIds: note.userId
	});

	for (const list of lists) {
		if (note.visibility == 'specified') {
			if (note.visibleUserIds.some(id => id.equals(list.userId))) {
				publishUserListStream(list._id, 'note', noteObj);
			}
		} else {
			publishUserListStream(list._id, 'note', noteObj);
		}
	}
}

async function publishToFollowers(note: INote, user: IUser, noteActivity: any) {
	const detailPackedNote = await pack(note, null, {
		detail: true,
		skipHide: true
	});

	const followers = await Following.find({
		followeeId: note.userId
	});

	const queue: string[] = [];

	for (const following of followers) {
		const follower = following._follower;

		if (isLocalUser(follower)) {
			// この投稿が返信ならスキップ
			if (note.replyId && !note._reply.userId.equals(following.followerId) && !note._reply.userId.equals(note.userId))
				continue;

			// Publish event to followers stream
			publishHomeTimelineStream(following.followerId, detailPackedNote);

			if (isRemoteUser(user) || note.visibility != 'public') {
				publishHybridTimelineStream(following.followerId, detailPackedNote);
			}
		} else {
			// フォロワーがリモートユーザーかつ投稿者がローカルユーザーなら投稿を配信
			if (isLocalUser(user)) {
				const inbox = follower.sharedInbox || follower.inbox;
				if (!queue.includes(inbox)) queue.push(inbox);
			}
		}
	}

	for (const inbox of queue) {
		deliver(user as any, noteActivity, inbox);
	}

	// 後方互換製のため、Questionは時間差でNoteでも送る
	// Questionに対応してないインスタンスは、2つめのNoteだけを採用する
	// Questionに対応しているインスタンスは、同IDで採番されている2つめのNoteを無視する
	setTimeout(() => {
		if (noteActivity.object.type === 'Question') {
			const asNote = deepcopy(noteActivity);

			asNote.object.type = 'Note';
			asNote.object.content = asNote.object._misskey_fallback_content;

			for (const inbox of queue) {
				deliver(user as any, asNote, inbox);
			}
		}
	}, 10 * 1000);
}

function deliverNoteToMentionedRemoteUsers(mentionedUsers: IUser[], user: ILocalUser, noteActivity: any) {
	for (const u of mentionedUsers.filter(u => isRemoteUser(u))) {
		deliver(user, noteActivity, (u as IRemoteUser).inbox);
	}
}

async function createMentionedEvents(mentionedUsers: IUser[], note: INote, nm: NotificationManager) {
	for (const u of mentionedUsers.filter(u => isLocalUser(u))) {
		const detailPackedNote = await pack(note, u, {
			detail: true
		});

		publishMainStream(u._id, 'mention', detailPackedNote);

		// Create notification
		nm.push(u._id, 'mention');
	}
}

function saveQuote(renote: INote, note: INote) {
	Note.update({ _id: renote._id }, {
		$push: {
			_quoteIds: note._id
		}
	});
}

function saveReply(reply: INote, note: INote) {
	Note.update({ _id: reply._id }, {
		$inc: {
			repliesCount: 1
		}
	});
}

function incNotesCountOfUser(user: IUser) {
	User.update({ _id: user._id }, {
		$set: {
			updatedAt: new Date()
		},
		$inc: {
			notesCount: 1
		}
	});
}

function incNotesCount(user: IUser) {
	if (isLocalUser(user)) {
		Meta.update({}, {
			$inc: {
				'stats.notesCount': 1,
				'stats.originalNotesCount': 1
			}
		}, { upsert: true });
	} else {
		Meta.update({}, {
			$inc: {
				'stats.notesCount': 1
			}
		}, { upsert: true });
	}
}

async function extractMentionedUsers(user: IUser, tokens: ReturnType<typeof parse>): Promise<IUser[]> {
	if (tokens == null) return [];

	const mentions = extractMentions(tokens);

	let mentionedUsers =
		erase(null, await Promise.all(mentions.map(async m => {
			try {
				return await resolveUser(m.username, m.host ? m.host : user.host);
			} catch (e) {
				return null;
			}
		})));

	// Drop duplicate users
	mentionedUsers = mentionedUsers.filter((u, i, self) =>
		i === self.findIndex(u2 => u._id.equals(u2._id))
	);

	return mentionedUsers;
}
