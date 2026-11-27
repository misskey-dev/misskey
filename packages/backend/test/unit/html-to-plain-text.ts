/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, it } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import Fastify from 'fastify';
import { parse } from 'node-html-parser';
import { htmlToPlainText } from '@/misc/html-to-plain-text.js';
import { ClientServerService } from '@/server/web/ClientServerService.js';
import { HtmlTemplateService } from '@/server/web/HtmlTemplateService.js';
import { defaultDescription } from '@/server/web/views/_.js';
import type { Config } from '@/config.js';
import type { MiMeta } from '@/models/_.js';
import type { ClientLoggerService } from '@/server/web/ClientLoggerService.js';

describe('HTML descriptions as plain text', () => {
	it.each([
		['Misskey server', 'Misskey server'],
		['紹介<br>説明<BR />補足<br class="break">最後', '紹介 説明 補足 最後'],
		['<p>紹介</p><p>説明</p><div>補足</div>', '紹介 説明 補足'],
		['<ul><li>項目1</li><li>項目2</li></ul>', '項目1 項目2'],
		['<strong>紹介</strong><span style="color:red">文</span>', '紹介文'],
		['<a href="https://example.test/">リンク</a>', 'リンク'],
		['A &amp; B &quot;C&quot; &#39;D&#39; &#x1F680;&nbsp;E', 'A & B "C" \'D\' 🚀 E'],
		['紹介&lt;br&gt;説明&lt;BR /&gt;補足', '紹介 説明 補足'],
		['文字としての &lt;b&gt;紹介&lt;/b&gt;', '文字としての <b>紹介</b>'],
		['&amp;lt;br&amp;gt;', '&lt;br&gt;'],
		['<span title="1 > 0">紹介</span><br data-label="a > b">説明', '紹介 説明'],
		['<h2>紹介</h2><blockquote>説明</blockquote>', '紹介 説明'],
		['<section>one</section><section>two</section>', 'one two'],
		['<table><tr><td>紹介</td><td>説明</td></tr></table>', '紹介 説明'],
		['<table><tr><th>見出し</th><th>補足</th></tr><tr><td>紹介</td><td>説明</td></tr></table>', '見出し 補足 紹介 説明'],
		['紹介<option>hidden</option>文', '紹介文'],
		['紹介<xmp><b>hidden</b></xmp>文', '紹介文'],
		['\n  紹介\t\n説明  ', '紹介 説明'],
		['紹介<!-- comment --><script>secret</script><style>hidden</style><template>hidden</template>文', '紹介文'],
		['<div>紹介<br>説明', '紹介 説明'],
		['1 < 2 > 0', '1 < 2 > 0'],
		['<div><br></div>', ''],
		['', ''],
	])('converts %s into %s', (html, expected) => {
		expect(htmlToPlainText(html)).toBe(expected);
	});

	it.each([
		['紹介<br><span>説明 &amp; 補足</span>', '紹介 説明 & 補足'],
		['<section>one</section><section>two</section>', 'one two'],
		['紹介&lt;br&gt;説明&lt;BR /&gt;補足', '紹介 説明 補足'],
		['<div><br></div>', defaultDescription],
		[null, undefined],
	])('renders instance metadata through ClientServerService for %s', async (html, expected) => {
		const meta = { description: html, name: 'Test', bannerUrl: null } as MiMeta;
		const htmlTemplateService = mockDeep<HtmlTemplateService>();
		const clientLoggerService = mockDeep<ClientLoggerService>();
		htmlTemplateService.getCommonData.mockResolvedValue({
			config: { url: 'https://example.test' } as Config,
			version: 'test', langs: [], instanceName: 'Test', instanceUrl: 'https://example.test',
			icon: null, appleTouchIcon: null, themeColor: null,
			serverErrorImageUrl: '', infoImageUrl: '', notFoundImageUrl: '',
			now: 0, federationEnabled: true, frontendViteFiles: null,
			frontendBootloaderJs: null, frontendBootloaderCss: null,
			frontendEmbedViteFiles: null, frontendEmbedBootloaderJs: null, frontendEmbedBootloaderCss: null,
		});
		const service = new ClientServerService(
			{ url: 'https://example.test', rootDir: process.cwd() } as Config,
			meta,
			mockDeep(), mockDeep(), mockDeep(), mockDeep(), mockDeep(),
			mockDeep(), mockDeep(), mockDeep(), mockDeep(), mockDeep(),
			mockDeep(), mockDeep(), mockDeep(), mockDeep(), mockDeep(),
			mockDeep(), mockDeep(), mockDeep(), mockDeep(), mockDeep(), mockDeep(),
			htmlTemplateService,
			clientLoggerService,
		);
		const server = Fastify();
		try {
			server.register(service.createServer);
			const response = await server.inject({ method: 'GET', url: '/' });
			expect(response.statusCode, JSON.stringify(clientLoggerService.logger.error.mock.calls)).toBe(200);
			const document = parse(response.body);
			expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(expected);
			expect(document.querySelector('meta[property="og:description"]')?.getAttribute('content')).toBe(expected ?? defaultDescription);
			expect(response.body).not.toContain('&lt;span');
			expect(response.body).not.toContain('&lt;br');
		} finally {
			await server.close();
		}
	});
});
