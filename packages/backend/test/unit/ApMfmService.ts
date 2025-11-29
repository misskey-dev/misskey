/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as assert from 'assert';
import { Test } from '@nestjs/testing';

import { CoreModule } from '@/core/CoreModule.js';
import { ApMfmService } from '@/core/activitypub/ApMfmService.js';
import { GlobalModule } from '@/GlobalModule.js';
import { MiNote } from '@/models/Note.js';

describe('ApMfmService', () => {
	let apMfmService: ApMfmService;

	beforeAll(async () => {
		const app = await Test.createTestingModule({
			imports: [GlobalModule, CoreModule],
		}).compile();
		apMfmService = app.get<ApMfmService>(ApMfmService);
	});

	describe('getNoteHtml', () => {
		test('Do not provide _misskey_content for simple text', () => {
			const note = {
				text: 'テキスト #タグ @mention 🍊 :emoji: https://example.com',
				mentionedRemoteUsers: '[]',
			};

			const { content, noMisskeyContent } = apMfmService.getNoteHtml(note);

			assert.equal(noMisskeyContent, true, 'noMisskeyContent');
			assert.equal(content, '<p>テキスト <a href="http://misskey.local/tags/%E3%82%BF%E3%82%B0" rel="tag">#タグ</a> <a href="http://misskey.local/@mention" class="u-url mention">@mention</a> 🍊 ​:emoji:​ <a href="https://example.com">https://example.com</a></p>', 'content');
		});

		test('Provide _misskey_content for MFM', () => {
			const note = {
				text: '$[tada foo]',
				mentionedRemoteUsers: '[]',
			};

			const { content, noMisskeyContent } = apMfmService.getNoteHtml(note);

			assert.equal(noMisskeyContent, false, 'noMisskeyContent');
			assert.equal(content, '<p><i>foo</i></p>', 'content');
		});
	});
});
