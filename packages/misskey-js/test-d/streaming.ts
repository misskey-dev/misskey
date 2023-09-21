import { expectType } from 'tsd';
import * as Misskey from '../src';

describe('Streaming', () => {
	test('emit type', async () => {
		const stream = new Misskey.Stream('https://misskey.test', { token: 'TOKEN' });
		const mainChannel = stream.useChannel('main');
		mainChannel.on('notification', notification => {
			expectType<Misskey.entities.Notification>(notification);
		});
	});

	test('params type', async () => {
		const stream = new Misskey.Stream('https://misskey.test', { token: 'TOKEN' });
		// TODO: 「stream.useChannel の第二引数として受け入れる型が
		// {
		//   otherparty?: User['id'] | null;
		//   group?: UserGroup['id'] | null;
		// }
		// になっている」というテストを行いたいけどtsdでの書き方がわからない
		const messagingChannel = stream.useChannel('messaging', { otherparty: 'aaa' });
		messagingChannel.on('message', message => {
			expectType<Misskey.entities.MessagingMessage>(message);
		});
	});
});
