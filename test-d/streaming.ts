import { expectType } from 'tsd';
import * as Misskey from '../src';

describe('Streaming', () => {
	test('emit type', async () => {
		const stream = new Misskey.Stream('https://misskey.test', { token: 'TOKEN' });
		const mainChannel = stream.useSharedConnection('main');
		mainChannel.on('notification', notification => {
			expectType<Misskey.entities.Notification>(notification);
		});
	});
});
