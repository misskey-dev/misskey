/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { bindThis } from '@/decorators.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { isRenotePacked, isQuotePacked } from '@/misc/is-renote.js';
import type { Packed } from '@/misc/json-schema.js';
import type { MiUser } from '@/models/User.js';

@Injectable()
export class NoteStreamingFilterService {
	constructor(
		private noteEntityService: NoteEntityService,
	) {}

	/**
	 * ストリーミング配信用にノートの可視性をフィルタリングする
	 * ロックダウン設定やvisibility設定に基づいて、ノートを隠すか流さないかを判定する
	 *
	 * @param note - フィルタリング対象のノート
	 * @param meId - 閲覧者のユーザーID（未ログインの場合はnull）
	 * @returns 'show'（そのまま/隠して流す）または 'skip'（流さない）
	 */
	@bindThis
	public async filterForStreaming(
		note: Packed<'Note'>,
		meId: MiUser['id'] | null,
	): Promise<'show' | 'skip'> {
		// 1階層目: note自体
		const shouldHideThisNote = await this.noteEntityService.shouldHideNote(note, meId);
		if (shouldHideThisNote) {
			if (isRenotePacked(note) && isQuotePacked(note)) {
				// 引用リノートの場合、内容を隠して流す
				this.noteEntityService.hideNote(note);
			} else if (isRenotePacked(note)) {
				// 純粋リノートの場合、流さない
				return 'skip';
			} else {
				// 通常ノートの場合、内容を隠して流す
				this.noteEntityService.hideNote(note);
			}
		}

		// 2階層目: note.renote
		if (isRenotePacked(note) && note.renote) {
			const shouldHideRenote = await this.noteEntityService.shouldHideNote(note.renote, meId);
			if (shouldHideRenote) {
				if (isQuotePacked(note)) {
					// noteが引用リノートの場合、renote部分だけ隠す
					this.noteEntityService.hideNote(note.renote);
				} else {
					// noteが純粋リノートの場合、流さない
					return 'skip';
				}
			}
		}

		// 3階層目: note.renote.renote
		if (isRenotePacked(note) && note.renote &&
			isRenotePacked(note.renote) && note.renote.renote) {
			const shouldHideRenoteRenote = await this.noteEntityService.shouldHideNote(note.renote.renote, meId);
			if (shouldHideRenoteRenote) {
				if (isQuotePacked(note.renote)) {
					// note.renoteが引用リノートの場合、renote.renote部分だけ隠す
					this.noteEntityService.hideNote(note.renote.renote);
				} else {
					// note.renoteが純粋リノートの場合、note.renoteの意味がなくなるので流さない
					return 'skip';
				}
			}
		}

		return 'show';
	}
}
