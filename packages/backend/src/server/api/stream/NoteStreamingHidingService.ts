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

type HiddenLayer = 'note' | 'renote' | 'renoteRenote';

type LockdownCheckResult =
	| { shouldSkip: true }
	| { shouldSkip: false; hiddenLayers: Set<HiddenLayer> };

/** Streamにおいて、ノートを隠す（hideNote）を適用するためのService */
@Injectable()
export class NoteStreamingHidingService {
	constructor(
		private noteEntityService: NoteEntityService,
	) {}

	/**
	 * ノートの可視性を判定する
	 *
	 * @param note - 判定対象のノート
	 * @param meId - 閲覧者のユーザーID（未ログインの場合はnull）
	 * @returns shouldSkip: true の場合はノートを流さない、false の場合は hiddenLayers に基づいて隠す
	 */
	@bindThis
	public async shouldHide(
		note: Packed<'Note'>,
		meId: MiUser['id'] | null,
	): Promise<LockdownCheckResult> {
		const hiddenLayers = new Set<HiddenLayer>();

		// 1階層目: note自体
		const shouldHideThisNote = await this.noteEntityService.shouldHideNote(note, meId);
		if (shouldHideThisNote) {
			if (isRenotePacked(note) && isQuotePacked(note)) {
				// 引用リノートの場合、内容を隠して流す
				hiddenLayers.add('note');
			} else if (isRenotePacked(note)) {
				// 純粋リノートの場合、流さない
				return { shouldSkip: true };
			} else {
				// 通常ノートの場合、内容を隠して流す
				hiddenLayers.add('note');
			}
		}

		// 2階層目: note.renote
		if (isRenotePacked(note) && note.renote) {
			const shouldHideRenote = await this.noteEntityService.shouldHideNote(note.renote, meId);
			if (shouldHideRenote) {
				if (isQuotePacked(note)) {
					// noteが引用リノートの場合、renote部分だけ隠す
					hiddenLayers.add('renote');
				} else {
					// noteが純粋リノートの場合、流さない
					return { shouldSkip: true };
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
					hiddenLayers.add('renoteRenote');
				} else {
					// note.renoteが純粋リノートの場合、note.renoteの意味がなくなるので流さない
					return { shouldSkip: true };
				}
			}
		}

		return { shouldSkip: false, hiddenLayers };
	}

	/**
	 * hiddenLayersに基づいてノートの内容を隠す。
	 *
	 * この処理は渡された `note` を直接変更します。
	 *
	 * @param note - 処理対象のノート
	 * @param hiddenLayers - 隠す階層のセット
	 */
	@bindThis
	public applyHiding(
		note: Packed<'Note'>,
		hiddenLayers: Set<HiddenLayer>,
	): void {
		if (hiddenLayers.has('note')) {
			this.noteEntityService.hideNote(note);
		}
		if (hiddenLayers.has('renote') && note.renote) {
			this.noteEntityService.hideNote(note.renote);
		}
		if (hiddenLayers.has('renoteRenote') && note.renote && note.renote.renote) {
			this.noteEntityService.hideNote(note.renote.renote);
		}
	}

	/**
	 * ストリーミング配信用にノートを隠す（あるいはそもそも送信しない）の判定及び処理を行う。
	 *
	 * この処理は渡された `note` を直接変更します。
	 *
	 * @param note - 処理対象のノート（必要に応じて内容が隠される）
	 * @param meId - 閲覧者のユーザーID（未ログインの場合はnull）
	 * @returns shouldSkip: true の場合はノートを流さない
	 */
	@bindThis
	public async processHiding(
		note: Packed<'Note'>,
		meId: MiUser['id'] | null,
	): Promise<{ shouldSkip: boolean }> {
		const result = await this.shouldHide(note, meId);
		if (result.shouldSkip) {
			return { shouldSkip: true };
		}
		this.applyHiding(note, result.hiddenLayers);
		return { shouldSkip: false };
	}
}
