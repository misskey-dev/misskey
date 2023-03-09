import { describe, test, assert, afterEach } from 'vitest';
import { render, cleanup, type RenderResult } from '@testing-library/vue';
import './init';
import type { DriveFile } from 'misskey-js/built/entities';
import { directives } from '@/directives';
import MkMediaImage from '@/components/MkMediaImage.vue';

describe('MkMediaImage', () => {
	const renderMediaImage = (image: Partial<DriveFile>): RenderResult => {
		return render(MkMediaImage, {
			props: { image },
			global: { directives },
		});
	};

	afterEach(() => {
		cleanup();
	});

	test('Attaching JPG should show no indicator', async () => {
		const mkMediaImage = renderMediaImage({
			type: 'image/jpeg',
		});
		const [gif, alt] = await Promise.all([
			mkMediaImage.queryByText('GIF'),
			mkMediaImage.queryByText('ALT'),
		]);
		assert.ok(!gif);
		assert.ok(!alt);
	});

	test('Attaching GIF should show a GIF indicator', async () => {
		const mkMediaImage = renderMediaImage({
			type: 'image/gif',
		});
		const [gif, alt] = await Promise.all([
			mkMediaImage.queryByText('GIF'),
			mkMediaImage.queryByText('ALT'),
		]);
		assert.ok(gif);
		assert.ok(!alt);
	});

	test('Attaching APNG should show a GIF indicator', async () => {
		const mkMediaImage = renderMediaImage({
			type: 'image/apng',
		});
		const [gif, alt] = await Promise.all([
			mkMediaImage.queryByText('GIF'),
			mkMediaImage.queryByText('ALT'),
		]);
		assert.ok(gif);
		assert.ok(!alt);
	});

	test('Attaching image with an alt message should show an ALT indicator', async () => {
		const mkMediaImage = renderMediaImage({
			type: 'image/png',
			comment: 'Misskeyのロゴです',
		});
		const [gif, alt] = await Promise.all([
			mkMediaImage.queryByText('GIF'),
			mkMediaImage.queryByText('ALT'),
		]);
		assert.ok(!gif);
		assert.ok(alt);
	});

	test('Attaching GIF image with an alt message should show a GIF and an ALT indicator', async () => {
		const mkMediaImage = renderMediaImage({
			type: 'image/gif',
			comment: 'Misskeyのロゴです',
		});
		const [gif, alt] = await Promise.all([
			mkMediaImage.queryByText('GIF'),
			mkMediaImage.queryByText('ALT'),
		]);
		assert.ok(gif);
		assert.ok(alt);
	});
});
