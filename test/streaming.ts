import WS from 'jest-websocket-mock';
import Stream from '../src/streaming';

describe('Streaming', () => {
	test('useChannel', async () => {
		const server = new WS('wss://misskey.test/streaming');
		const stream = new Stream('https://misskey.test', { token: 'TOKEN' });
		const mainChannelReceived: any[] = [];
		const main = stream.useChannel('main');
		main.on('meUpdated', payload => {
			mainChannelReceived.push(payload);
		});
		await server.connected;
		const msg = JSON.parse(await server.nextMessage as string);
		const mainChannelId = msg.body.id;
		expect(msg.type).toEqual('connect');
		expect(msg.body.channel).toEqual('main');
		expect(mainChannelId != null).toEqual(true);

		server.send(JSON.stringify({
			type: 'channel',
			body: {
				id: mainChannelId,
				type: 'meUpdated',
				body: {
					id: 'foo'
				}
			}
		}));

		expect(mainChannelReceived[0]).toEqual({
			id: 'foo'
		});

		stream.close();
		server.close();
	});

	test('useChannel with parameters', async () => {
		const server = new WS('wss://misskey.test/streaming');
		const stream = new Stream('https://misskey.test', { token: 'TOKEN' });
		const messagingChannelReceived: any[] = [];
		const messaging = stream.useChannel('messaging', { otherparty: 'aaa' });
		messaging.on('message', payload => {
			messagingChannelReceived.push(payload);
		});
		await server.connected;
		const msg = JSON.parse(await server.nextMessage as string);
		const messagingChannelId = msg.body.id;
		expect(msg.type).toEqual('connect');
		expect(msg.body.channel).toEqual('messaging');
		expect(msg.body.params).toEqual({ otherparty: 'aaa' });
		expect(messagingChannelId != null).toEqual(true);

		server.send(JSON.stringify({
			type: 'channel',
			body: {
				id: messagingChannelId,
				type: 'message',
				body: {
					id: 'foo'
				}
			}
		}));

		expect(messagingChannelReceived[0]).toEqual({
			id: 'foo'
		});

		stream.close();
		server.close();
	});

	test('ちゃんとチャンネルごとにidが異なる', async () => {
		const server = new WS('wss://misskey.test/streaming');
		const stream = new Stream('https://misskey.test', { token: 'TOKEN' });

		stream.useChannel('messaging', { otherparty: 'aaa' });
		stream.useChannel('messaging', { otherparty: 'bbb' });

		await server.connected;

		const msg = JSON.parse(await server.nextMessage as string);
		const messagingChannelId = msg.body.id;
		const msg2 = JSON.parse(await server.nextMessage as string);
		const messagingChannelId2 = msg2.body.id;

		expect(messagingChannelId != null).toEqual(true);
		expect(messagingChannelId2 != null).toEqual(true);
		expect(messagingChannelId).not.toEqual(messagingChannelId2);

		stream.close();
		server.close();
	});

	test('Connection#dispose', async () => {
		const server = new WS('wss://misskey.test/streaming');
		const stream = new Stream('https://misskey.test', { token: 'TOKEN' });
		const mainChannelReceived: any[] = [];
		const main = stream.useChannel('main');
		main.on('meUpdated', payload => {
			mainChannelReceived.push(payload);
		});
		await server.connected;
		const msg = JSON.parse(await server.nextMessage as string);
		const mainChannelId = msg.body.id;
		expect(msg.type).toEqual('connect');
		expect(msg.body.channel).toEqual('main');
		expect(mainChannelId != null).toEqual(true);
		main.dispose();

		server.send(JSON.stringify({
			type: 'channel',
			body: {
				id: mainChannelId,
				type: 'meUpdated',
				body: {
					id: 'foo'
				}
			}
		}));

		expect(mainChannelReceived.length).toEqual(0);

		stream.close();
		server.close();
	});

	// TODO: SharedConnection#dispose して一定時間経ったら disconnect メッセージがサーバーに送られてくるかのテスト

	// TODO: チャンネル接続が使いまわされるかのテスト
});
