import autobind from 'autobind-decorator';
import shouldMuteThisNote from '../../../../misc/should-mute-this-note';
import Channel from '../channel';
import { Notes } from '../../../../models';
import { PackedNote } from '../../../../models/repositories/note';
import { checkWordMute } from '../../../../misc/check-word-mute';

export default class extends Channel {
	public readonly chName = 'homeTimeline';
	public static shouldShare = true;
	public static requireCredential = true;

	@autobind
	public async init(params: any) {
		// Subscribe events
		this.subscriber.on('notesStream', this.onNote);
	}

	@autobind
	private async onNote(note: PackedNote) {
		// その投稿のユーザーをフォローしていなかったら弾く
		if (this.user!.id !== note.userId && !this.following.includes(note.userId)) return;

		if (['followers', 'specified'].includes(note.visibility)) {
			note = await Notes.pack(note.id, this.user!, {
				detail: true
			});

			if (note.isHidden) {
				return;
			}
		} else {
			// リプライなら再pack
			if (note.replyId != null) {
				note.reply = await Notes.pack(note.replyId, this.user!, {
					detail: true
				});
			}
			// Renoteなら再pack
			if (note.renoteId != null) {
				note.renote = await Notes.pack(note.renoteId, this.user!, {
					detail: true
				});
			}
		}

		// 関係ない返信は除外
		if (note.reply) {
			// 「チャンネル接続主への返信」でもなければ、「チャンネル接続主が行った返信」でもなければ、「投稿者の投稿者自身への返信」でもない場合
			if (note.reply.userId !== this.user!.id && note.userId !== this.user!.id && note.reply.userId !== note.userId) return;
		}

		// 流れてきたNoteがミュートしているユーザーが関わるものだったら無視する
		if (shouldMuteThisNote(note, this.muting)) return;

		// 流れてきたNoteがミュートすべきNoteだったら無視する
		// TODO: 将来的には、単にMutedNoteテーブルにレコードがあるかどうかで判定したい(以下の理由により難しそうではある)
		// 現状では、ワードミュートにおけるMutedNoteレコードの追加処理はストリーミングに流す処理と並列で行われるため、
		// レコードが追加されるNoteでも追加されるより先にここのストリーミングの処理に到達することが起こる。
		// そのためレコードが存在するかのチェックでは不十分なので、改めてcheckWordMuteを呼んでいる
		if (this.userProfile?.enableWordMute && await checkWordMute(note, this.user, this.userProfile.mutedWords)) return;

		this.send('note', note);
	}

	@autobind
	public dispose() {
		// Unsubscribe events
		this.subscriber.off('notesStream', this.onNote);
	}
}
