import es from '../../db/elasticsearch';
import { publishMainStream, publishHomeTimelineStream, publishLocalTimelineStream, publishHybridTimelineStream, publishGlobalTimelineStream, publishUserListStream, publishHashtagStream } from '../stream';
import { deliver } from '../../queue';
import renderNote from '../../remote/activitypub/renderer/note';
import renderCreate from '../../remote/activitypub/renderer/create';
import renderAnnounce from '../../remote/activitypub/renderer/announce';
import { renderActivity } from '../../remote/activitypub/renderer';
import notify from '../../services/create-notification';
import watch from './watch';
import { parse } from '../../mfm/parse';
import resolveUser from '../../remote/resolve-user';
import config from '../../config';
import { updateHashtag } from '../update-hashtag';
import notesChart from '../chart/charts/notes';
import perUserNotesChart from '../chart/charts/per-user-notes';
import activeUsersChart from '../chart/charts/active-users';
import instanceChart from '../chart/charts/instance';
import * as deepcopy from 'deepcopy';
import { erase, concat } from '../../prelude/array';
import insertNoteUnread from './unread';
import { registerOrFetchInstanceDoc } from '../register-or-fetch-instance-doc';
import extractMentions from '../../misc/extract-mentions';
import extractEmojis from '../../misc/extract-emojis';
import extractHashtags from '../../misc/extract-hashtags';
import { Note } from '../../models/entities/note';
import { Mutings, Users, NoteWatchings, UserLists, UserListJoinings, Followings, Notes, Instances } from '../../models';
import { DriveFile } from '../../models/entities/drive-file';
import { App } from '../../models/entities/app';
import { In, Not } from 'typeorm';
import { User, ILocalUser, IRemoteUser } from '../../models/entities/user';

type NotificationType = 'reply' | 'renote' | 'quote' | 'mention';

class NotificationManager {
	private notifier: User;
	private note: Note;
	private queue: {
		target: ILocalUser['id'];
		reason: NotificationType;
	}[];

	constructor(notifier: User, note: Note) {
		this.notifier = notifier;
		this.note = note;
		this.queue = [];
	}

	public push(notifiee: ILocalUser['id'], reason: NotificationType) {
		// 自分自身へは通知しない
		if (this.notifier.id === notifiee) return;

		const exist = this.queue.find(x => x.target === notifiee);

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
			const mentioneeMutes = await Mutings.find({
				muterId: x.target
			});

			const mentioneesMutedUserIds = mentioneeMutes.map(m => m.muteeId);

			// 通知される側のユーザーが通知する側のユーザーをミュートしていない限りは通知する
			if (!mentioneesMutedUserIds.includes(this.notifier.id)) {
				notify(x.target, this.notifier.id, x.reason, {
					noteId: this.note.id
				});
			}
		}
	}
}

type Option = {
	createdAt?: Date;
	name?: string;
	text?: string;
	reply?: Note;
	renote?: Note;
	files?: DriveFile[];
	geo?: any;
	poll?: Note['poll'];
	viaMobile?: boolean;
	localOnly?: boolean;
	cw?: string;
	visibility?: string;
	visibleUsers?: User[];
	apMentions?: User[];
	apHashtags?: string[];
	apEmojis?: string[];
	questionUri?: string;
	uri?: string;
	app?: App;
};

export default async (user: User, data: Option, silent = false) => new Promise<Note>(async (res, rej) => {
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
			? concat(data.poll.choices.map(choice => parse(choice.text)))
			: [];

		const combinedTokens = tokens.concat(cwTokens).concat(choiceTokens);

		tags = data.apHashtags || extractHashtags(combinedTokens);

		emojis = data.apEmojis || extractEmojis(combinedTokens);

		mentionedUsers = data.apMentions || await extractMentionedUsers(user, combinedTokens);
	}

	tags = tags.filter(tag => tag.length <= 100);

	if (data.reply && (user.id !== data.reply.userId) && !mentionedUsers.some(u => u.id === data.reply.userId)) {
		mentionedUsers.push(await Users.findOne(data.reply.userId));
	}

	if (data.visibility == 'specified') {
		for (const u of data.visibleUsers) {
			if (!mentionedUsers.some(x => x.id === u.id)) {
				mentionedUsers.push(u);
			}
		}

		for (const u of mentionedUsers) {
			if (!data.visibleUsers.some(x => x.id === u.id)) {
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
	if (Users.isRemoteUser(user)) activeUsersChart.update(user);

	// Register host
	if (Users.isRemoteUser(user)) {
		registerOrFetchInstanceDoc(user.host).then(i => {
			Instances.increment({ id: i.id }, 'notesCount', 1);
			instanceChart.updateNote(i.host, true);
		});
	}

	// ハッシュタグ更新
	for (const tag of tags) updateHashtag(user, tag);

	// ファイルが添付されていた場合ドライブのファイルの「このファイルが添付された投稿一覧」プロパティにこの投稿を追加
	if (data.files) {
		for (const file of data.files) {
			DriveFile.update({ _id: file.id }, {
				$push: {
					'metadata.attachedNoteIds': note.id
				}
			});
		}
	}

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

	// Pack the note
	const noteObj = await Notes.pack(note);

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

	if (Users.isLocalUser(user)) {
		deliverNoteToMentionedRemoteUsers(mentionedUsers, user, noteActivity);
	}

	// If has in reply to note
	if (data.reply) {
		// Fetch watchers
		nmRelatedPromises.push(notifyToWatchersOfReplyee(data.reply, user, nm));

		// この投稿をWatchする
		if (Users.isLocalUser(user) && user.autoWatch !== false) {
			watch(user.id, data.reply);
		}

		// 通知
		if (Users.isLocalUser(data.reply._user)) {
			nm.push(data.reply.userId, 'reply');
			publishMainStream(data.reply.userId, 'reply', noteObj);
		}
	}

	// If it is renote
	if (data.renote) {
		const type = data.text ? 'quote' : 'renote';

		// Notify
		if (Users.isLocalUser(data.renote._user)) {
			nm.push(data.renote.userId, type);
		}

		// Fetch watchers
		nmRelatedPromises.push(notifyToWatchersOfRenotee(data.renote, user, nm, type));

		// この投稿をWatchする
		if (Users.isLocalUser(user) && user.autoWatch !== false) {
			watch(user.id, data.renote);
		}

		// Publish event
		if ((user.id !== data.renote.userId) && Users.isLocalUser(data.renote._user)) {
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

async function renderNoteOrRenoteActivity(data: Option, note: Note) {
	if (data.localOnly) return null;

	const content = data.renote && data.text == null && data.poll == null && (data.files == null || data.files.length == 0)
		? renderAnnounce(data.renote.uri ? data.renote.uri : `${config.url}/notes/${data.renote.id}`, note)
		: renderCreate(await renderNote(note, false), note);

	return renderActivity(content);
}

function incRenoteCount(renote: Note) {
	Notes.increment({ id: renote.id }, 'renoteCount', 1);
	Notes.increment({ id: renote.id }, 'score', 1);
}

async function publish(user: User, note: Note, noteObj: any, reply: Note, renote: Note, visibleUsers: User[], noteActivity: any) {
	if (Users.isLocalUser(user)) {
		// 投稿がリプライかつ投稿者がローカルユーザーかつリプライ先の投稿の投稿者がリモートユーザーなら配送
		if (reply && Users.isRemoteUser(reply._user)) {
			deliver(user, noteActivity, reply._user.inbox);
		}

		// 投稿がRenoteかつ投稿者がローカルユーザーかつRenote元の投稿の投稿者がリモートユーザーなら配送
		if (renote && Users.isRemoteUser(renote._user)) {
			deliver(user, noteActivity, renote._user.inbox);
		}

		if (['followers', 'specified'].includes(note.visibility)) {
			const detailPackedNote = await Notes.pack(note, user, {
				detail: true
			});
			// Publish event to myself's stream
			publishHomeTimelineStream(note.userId, detailPackedNote);
			publishHybridTimelineStream(note.userId, detailPackedNote);

			if (note.visibility == 'specified') {
				for (const u of visibleUsers) {
					if (u.id !== user.id) {
						publishHomeTimelineStream(u.id, detailPackedNote);
						publishHybridTimelineStream(u.id, detailPackedNote);
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
		publishToFollowers(note, user, noteActivity, reply);
	}

	// リストに配信
	publishToUserLists(note, noteObj);
}

async function insertNote(user: User, data: Option, tags: string[], emojis: string[], mentionedUsers: User[]) {
	const insert: any = {
		createdAt: data.createdAt,
		fileIds: data.files ? data.files.map(file => file.id) : [],
		replyId: data.reply ? data.reply.id : null,
		renoteId: data.renote ? data.renote.id : null,
		name: data.name,
		text: data.text,
		poll: data.poll,
		cw: data.cw == null ? null : data.cw,
		tags,
		tagsLower: tags.map(tag => tag.toLowerCase()),
		emojis,
		userId: user.id,
		viaMobile: data.viaMobile,
		localOnly: data.localOnly,
		geo: data.geo || null,
		appId: data.app ? data.app.id : null,
		visibility: data.visibility,
		visibleUserIds: data.visibility == 'specified'
			? data.visibleUsers
				? data.visibleUsers.map(u => u.id)
				: []
			: [],

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
			inbox: Users.isRemoteUser(user) ? user.inbox : undefined
		},
		_files: data.files ? data.files : []
	};

	if (data.uri != null) insert.uri = data.uri;

	// Append mentions data
	if (mentionedUsers.length > 0) {
		insert.mentions = mentionedUsers.map(u => u.id);
		insert.mentionedRemoteUsers = mentionedUsers.filter(u => Users.isRemoteUser(u)).map(u => ({
			uri: (u as IRemoteUser).uri,
			username: u.username,
			host: u.host
		}));
	}

	// 投稿を作成
	try {
		return await Notes.save(insert);
	} catch (e) {
		// duplicate key error
		if (e.code === 11000) {
			return null;
		}

		throw 'something happened';
	}
}

function index(note: Note) {
	if (note.text == null || config.elasticsearch == null) return;

	es.index({
		index: 'misskey',
		type: 'note',
		id: note.id.toString(),
		body: {
			text: note.text
		}
	});
}

async function notifyToWatchersOfRenotee(renote: Note, user: User, nm: NotificationManager, type: NotificationType) {
	const watchers = await NoteWatchings.find({
		noteId: renote.id,
		userId: Not(user.id)
	});

	for (const watcher of watchers) {
		nm.push(watcher.userId, type);
	}
}

async function notifyToWatchersOfReplyee(reply: Note, user: User, nm: NotificationManager) {
	const watchers = await NoteWatchings.find({
		noteId: reply.id,
		userId: Not(user.id)
	});

	for (const watcher of watchers) {
		nm.push(watcher.userId, 'reply');
	}
}

async function publishToUserLists(note: Note, noteObj: any) {
	const joinings = await UserListJoinings.find({
		userId: note.userId
	});

	const lists = await UserLists.find({
		id: In(joinings.map(j => j.userListId))
	});

	for (const list of lists) {
		if (note.visibility == 'specified') {
			if (note.visibleUserIds.some(id => id === list.userId)) {
				publishUserListStream(list.id, 'note', noteObj);
			}
		} else {
			publishUserListStream(list.id, 'note', noteObj);
		}
	}
}

async function publishToFollowers(note: Note, user: User, noteActivity: any, reply: Note) {
	const detailPackedNote = await Notes.pack(note, null, {
		detail: true,
		skipHide: true
	});

	const followers = await Followings.find({
		followeeId: note.userId
	});

	const queue: string[] = [];

	for (const following of followers) {
		const follower = {
			host: following.followerHost,
			inbox: following.followerInbox,
			sharedInbox: following.followerSharedInbox,
		};

		if (Users.isLocalUser(follower)) {
			// この投稿が返信ならスキップ
			if (note.replyId && (reply.userId !== following.followerId) && (reply.userId !== note.userId))
				continue;

			// Publish event to followers stream
			publishHomeTimelineStream(following.followerId, detailPackedNote);

			if (Users.isRemoteUser(user) || note.visibility != 'public') {
				publishHybridTimelineStream(following.followerId, detailPackedNote);
			}
		} else {
			// フォロワーがリモートユーザーかつ投稿者がローカルユーザーなら投稿を配信
			if (Users.isLocalUser(user)) {
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

function deliverNoteToMentionedRemoteUsers(mentionedUsers: User[], user: ILocalUser, noteActivity: any) {
	for (const u of mentionedUsers.filter(u => Users.isRemoteUser(u))) {
		deliver(user, noteActivity, (u as IRemoteUser).inbox);
	}
}

async function createMentionedEvents(mentionedUsers: User[], note: Note, nm: NotificationManager) {
	for (const u of mentionedUsers.filter(u => Users.isLocalUser(u))) {
		const detailPackedNote = await Notes.pack(note, u, {
			detail: true
		});

		publishMainStream(u.id, 'mention', detailPackedNote);

		// Create notification
		nm.push(u.id, 'mention');
	}
}

function saveReply(reply: Note, note: Note) {
	Notes.increment({ id: reply.id }, 'repliesCount', 1);
}

function incNotesCountOfUser(user: User) {
	Users.increment({ id: user.id }, 'notesCount', 1);
	Users.update({ id: user.id }, {
		updatedAt: new Date()
	});
}

async function extractMentionedUsers(user: User, tokens: ReturnType<typeof parse>): Promise<User[]> {
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
		i === self.findIndex(u2 => u.id.equals(u2.id))
	);

	return mentionedUsers;
}
