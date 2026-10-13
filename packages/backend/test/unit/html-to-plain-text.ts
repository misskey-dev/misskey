/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, it } from 'vitest';
import { parse } from 'node-html-parser';
import { htmlToPlainText } from '@/misc/html-to-plain-text.js';
import { BasePage } from '@/server/web/views/base.js';
import { defaultDescription } from '@/server/web/views/_.js';
import type { Config } from '@/config.js';

describe('HTML descriptions as plain text', () => {
	it.each([
		['Misskey server', 'Misskey server'],
		['紹介<br>説明<BR />補足<br class="break">最後', '紹介 説明 補足 最後'],
		['<p>紹介</p><p>説明</p><div>補足</div>', '紹介 説明 補足'],
		['<ul><li>項目1</li><li>項目2</li></ul>', '項目1 項目2'],
		['<strong>紹介</strong><span style="color:red">文</span>', '紹介文'],
		['<a href="https://example.test/">リンク</a>', 'リンク'],
		['A &amp; B &quot;C&quot; &#39;D&#39; &#x1F680;&nbsp;E', 'A & B "C" \'D\' 🚀 E'],
		['文字としての &lt;br&gt;', '文字としての <br>'],
		['\n  紹介\t\n説明  ', '紹介 説明'],
		['紹介<!-- comment --><script>secret</script><style>hidden</style><template>hidden</template>文', '紹介文'],
		['<div>紹介<br>説明', '紹介 説明'],
		['1 < 2 > 0', '1 < 2 > 0'],
		['<div><br></div>', ''],
		['', ''],
	])('converts %s into %s', (html, expected) => {
		expect(htmlToPlainText(html)).toBe(expected);
	});

	it.each(['紹介<br><span>説明 &amp; 補足</span>', '<div><br></div>'])('renders plain metadata with correct escaping and fallback for %s', html => {
		const description = htmlToPlainText(html);
		const rendered = BasePage({
			config: { url: 'https://example.test' } as Config,
			version: 'test', langs: [], instanceName: 'Test', instanceUrl: 'https://example.test',
			icon: null, appleTouchIcon: null, themeColor: null,
			serverErrorImageUrl: '', infoImageUrl: '', notFoundImageUrl: '',
			now: 0, federationEnabled: true, frontendViteFiles: null,
			frontendBootloaderJs: null, frontendBootloaderCss: null,
			frontendEmbedViteFiles: null, frontendEmbedBootloaderJs: null, frontendEmbedBootloaderCss: null,
			desc: description,
		});
		const document = parse(rendered);
		for (const selector of ['meta[name="description"]', 'meta[property="og:description"]']) {
			expect(document.querySelector(selector)?.getAttribute('content')).toBe(description || defaultDescription);
		}
		expect(rendered).not.toContain('&lt;span');
		expect(rendered).not.toContain('&lt;br');
	});
});
