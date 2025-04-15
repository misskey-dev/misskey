/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import * as mfm from 'mfm-js';
import { MfmService, Appender } from '@/core/MfmService.js';
import type { MiNote } from '@/models/Note.js';
import { bindThis } from '@/decorators.js';
import { extractApHashtagObjects } from './models/tag.js';
import type { IObject } from './type.js';

@Injectable()
export class ApMfmService {
	constructor(
		private mfmService: MfmService,
	) {
	}

	@bindThis
	public htmlToMfm(html: string, tag?: IObject | IObject[]): string {
		const hashtagNames = extractApHashtagObjects(tag).map(x => x.name);
		return this.mfmService.fromHtml(html, hashtagNames);
	}

	@bindThis
	public getNoteHtml(note: Pick<MiNote, 'text' | 'mentionedRemoteUsers'>, additionalAppender: Appender[] = []) {
		let noMisskeyContent = false;
		const srcMfm = (note.text ?? '');

		const parsed = mfm.parse(srcMfm);

		if (!additionalAppender.length && parsed.every(n => ['text', 'unicodeEmoji', 'emojiCode', 'mention', 'hashtag', 'url'].includes(n.type))) {
			noMisskeyContent = true;
		}

		const content = this.mfmService.toHtml(parsed, JSON.parse(note.mentionedRemoteUsers), additionalAppender);

		return {
			content,
			noMisskeyContent,
		};
	}
}
