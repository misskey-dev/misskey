/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { bindThis } from '@/decorators.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { deepClone } from '@/misc/clone.js';
import { isRenotePacked, isQuotePacked } from '@/misc/is-renote.js';
import type { Packed } from '@/misc/json-schema.js';
import type { MiUser } from '@/models/User.js';

/** Streamにおいて、ノートを隠す（hideNote）を適用するためのService */
@Injectable()
export class NoteStreamingHidingService {
	constructor(
		private noteEntityService: NoteEntityService,
	) {}

	private collectRenoteChain(note: Packed<'Note'>): Packed<'Note'>[] {
		const renoteChain: Packed<'Note'>[] = [];

		for (let current: Packed<'Note'> | null | undefined = note; current != null; current = current.renote) {
			renoteChain.push(current);
		}

		return renoteChain;
	}

	/**
	 * ストリーミング配信用にノートの内容を隠す（あるいはそもそも送信しない）判定及び処理を行う。
	 *
	 * 隠す処理が必要な場合は元のノートをクローンして変更を適用したものを返し、
	 * 送信すべきでない場合は `null` を返す。
	 * 変更が不要な場合は元のノートの参照をそのまま返す。
	 *
	 * @param note - 処理対象のノート
	 * @param meId - 閲覧者のユーザー ID （未ログインの場合は `null`）
	 * @returns 配信するノートオブジェクト、または配信スキップの場合は `null`
	 */
	@bindThis
	public async filter(note: Packed<'Note'>, meId: MiUser['id'] | null): Promise<Packed<'Note'> | null> {
		const renoteChain = this.collectRenoteChain(note);
		const shouldHide = await Promise.all(renoteChain.map(n => this.noteEntityService.shouldHideNote(n, meId)));

		if (!shouldHide.some(h => h)) {
			// 隠す必要がない場合は元のノートをそのまま返す
			return note;
		}

		if (renoteChain.some(n => isRenotePacked(n) && !isQuotePacked(n))) {
			// 純粋リノートの場合は配信をスキップする
			return null;
		}

		const clonedNote = deepClone(note);
		let currentCloned = clonedNote;

		for (let i = 0; i < renoteChain.length; i++) {
			if (shouldHide[i]) {
				this.noteEntityService.hideNote(currentCloned);
			}
			currentCloned = currentCloned.renote!;
		}

		return clonedNote;
	}
}
