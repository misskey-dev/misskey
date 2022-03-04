import { isMutedUserRelated } from '@/misc/is-muted-user-related.js';
import Channel from '../channel.js';
import { fetchMeta } from '@/misc/fetch-meta.js';
import { Notes } from '@/models/index.js';
import { checkWordMute } from '@/misc/check-word-mute.js';
import { isBlockerUserRelated } from '@/misc/is-blocker-user-related.js';
import { Packed } from '@/misc/schema.js';

export default class extends Channel {
	public readonly chName = 'localTimeline';
	public static shouldShare = true;
	public static requireCredential = false;

	constructor(id: string, connection: Channel['connection']) {
		super(id, connection);
		this.onNote = this.onNote.bind(this);
	}

	public async init(params: any) {
		const meta = await fetchMeta();
		if (meta.disableLocalTimeline) {
			if (this.user == null || (!this.user.isAdmin && !this.user.isModerator)) return;
		}

		// Subscribe events
		this.subscriber.on('notesStream', this.onNote);
	}

	private async onNote(note: Packed<'Note'>) {
		if (note.user.host !== null) return;
		if (note.visibility !== 'public') return;
		if (note.channelId != null && !this.followingChannels.has(note.channelId)) return;

		// リプライなら再pack
		if (note.replyId != null) {
			note.reply = await Notes.pack(note.replyId, this.user, {
				detail: true,
			});
		}
		// Renoteなら再pack
		if (note.renoteId != null) {
			note.renote = await Notes.pack(note.renoteId, this.user, {
				detail: true,
			});
		}

		// 関係ない返信は除外
		if (note.reply && !this.user!.showTimelineReplies) {
			const reply = note.reply;
			// 「チャンネル接続主への返信」でもなければ、「チャンネル接続主が行った返信」でもなければ、「投稿者の投稿者自身への返信」でもない場合
			if (reply.userId !== this.user!.id && note.userId !== this.user!.id && reply.userId !== note.userId) return;
		}

		// 流れてきたNoteがミュートしているユーザーが関わるものだったら無視する
		if (isMutedUserRelated(note, this.muting)) return;
		// 流れてきたNoteがブロックされているユーザーが関わるものだったら無視する
		if (isBlockerUserRelated(note, this.blocking)) return;

		// 流れてきたNoteがミュートすべきNoteだったら無視する
		// TODO: 将来的には、単にMutedNoteテーブルにレコードがあるかどうかで判定したい(以下の理由により難しそうではある)
		// 現状では、ワードミュートにおけるMutedNoteレコードの追加処理はストリーミングに流す処理と並列で行われるため、
		// レコードが追加されるNoteでも追加されるより先にここのストリーミングの処理に到達することが起こる。
		// そのためレコードが存在するかのチェックでは不十分なので、改めてcheckWordMuteを呼んでいる
		if (this.userProfile && await checkWordMute(note, this.user, this.userProfile.mutedWords)) return;

		this.connection.cacheNote(note);

		this.send('note', note);
	}

	public dispose() {
		// Unsubscribe events
		this.subscriber.off('notesStream', this.onNote);
	}
}
