import { describe, test, expect, vi, afterEach } from 'vitest';
import WS from 'vitest-websocket-mock';
import Stream from '../src/streaming.js';

/**
 * A WebSocket stand-in whose lifecycle the test drives by hand.
 *
 * `vitest-websocket-mock` always delivers a close event, so it cannot express
 * the state a suspended device leaves behind: readyState is already CLOSED
 * while the close event is still queued and never gets delivered.
 */
class FrozenWebSocket {
	public static readonly CONNECTING = 0;
	public static readonly OPEN = 1;
	public static readonly CLOSING = 2;
	public static readonly CLOSED = 3;

	public static instances: FrozenWebSocket[] = [];

	public readyState: number = FrozenWebSocket.CONNECTING;
	public binaryType = 'blob';
	public readonly sent: string[] = [];

	private readonly listeners = new Map<string, Set<(ev: unknown) => void>>();

	constructor(public readonly url: string) {
		FrozenWebSocket.instances.push(this);
	}

	public addEventListener(type: string, fn: (ev: unknown) => void): void {
		let set = this.listeners.get(type);
		if (set == null) {
			set = new Set();
			this.listeners.set(type, set);
		}
		set.add(fn);
	}

	public removeEventListener(type: string, fn: (ev: unknown) => void): void {
		this.listeners.get(type)?.delete(fn);
	}

	public send(data: string): void {
		this.sent.push(data);
	}

	public close(): void {
		this.readyState = FrozenWebSocket.CLOSED;
	}

	/** Complete the handshake. */
	public acceptConnection(): void {
		this.readyState = FrozenWebSocket.OPEN;
		for (const fn of this.listeners.get('open') ?? []) fn({ type: 'open', target: this });
	}

	/** Die the way a suspended device does: CLOSED, but no close event ever arrives. */
	public dieWithoutCloseEvent(): void {
		this.readyState = FrozenWebSocket.CLOSED;
	}

	/** Die the ordinary way, with the close event delivered. */
	public dieWithCloseEvent(): void {
		this.readyState = FrozenWebSocket.CLOSED;
		for (const fn of this.listeners.get('close') ?? []) {
			fn({ type: 'close', code: 1006, reason: '', wasClean: false, target: this });
		}
	}

	/** Messages parsed back out of the wire format. */
	public get sentMessages(): { type: string; body: { channel?: string; id?: string; }; }[] {
		return this.sent.map(raw => JSON.parse(raw) as { type: string; body: { channel?: string; id?: string; }; });
	}
}

describe('Streaming', () => {
	const openStreams: Stream[] = [];

	// 張りっぱなしの接続を後始末する。残すと ReconnectingWebSocket が
	// 次のテストのモックサーバーを掴み、無関係なテストが原因から遠い形で落ちる。
	afterEach(() => {
		for (const stream of openStreams.splice(0)) stream.close();
		WS.clean();
	});

	function createStream(): Stream {
		const stream = new Stream('https://misskey.test', { token: 'TOKEN' });
		openStreams.push(stream);
		return stream;
	}

	// ソケットの開閉をテスト側から握る版。
	function createFrozenStream(): Stream {
		FrozenWebSocket.instances = [];
		const stream = new Stream('https://misskey.test', { token: 'TOKEN' }, {
			WebSocket: FrozenWebSocket,
		});
		openStreams.push(stream);
		return stream;
	}

	async function nthSocket(index: number): Promise<FrozenWebSocket> {
		await vi.waitFor(() => expect(FrozenWebSocket.instances.length).toBeGreaterThan(index));
		return FrozenWebSocket.instances[index];
	}

	test('useChannel', async () => {
		const server = new WS('wss://misskey.test/streaming');
		const stream = createStream();
		const mainChannelReceived: any[] = [];
		const main = stream.useChannel('main');
		main.on('meUpdated', payload => {
			mainChannelReceived.push(payload);
		});

		const ws = await server.connected;
		expect(new URLSearchParams(new URL(ws.url).search).get('i')).toEqual('TOKEN');

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
		const stream = createStream();
		const chatChannelReceived: any[] = [];
		const chat = stream.useChannel('chat', { other: 'aaa' });
		chat.on('message', payload => {
			chatChannelReceived.push(payload);
		});

		const ws = await server.connected;
		expect(new URLSearchParams(new URL(ws.url).search).get('i')).toEqual('TOKEN');

		const msg = JSON.parse(await server.nextMessage as string);
		const chatChannelId = msg.body.id;
		expect(msg.type).toEqual('connect');
		expect(msg.body.channel).toEqual('chat');
		expect(msg.body.params).toEqual({ other: 'aaa' });
		expect(chatChannelId != null).toEqual(true);

		server.send(JSON.stringify({
			type: 'channel',
			body: {
				id: chatChannelId,
				type: 'message',
				body: {
					id: 'foo'
				}
			}
		}));

		expect(chatChannelReceived[0]).toEqual({
			id: 'foo'
		});

		stream.close();
		server.close();
	});

	test('ちゃんとチャンネルごとにidが異なる', async () => {
		const server = new WS('wss://misskey.test/streaming');
		const stream = createStream();

		stream.useChannel('chat', { other: 'aaa' });
		stream.useChannel('chat', { other: 'bbb' });

		const ws = await server.connected;
		expect(new URLSearchParams(new URL(ws.url).search).get('i')).toEqual('TOKEN');

		const msg = JSON.parse(await server.nextMessage as string);
		const chatChannelId = msg.body.id;
		const msg2 = JSON.parse(await server.nextMessage as string);
		const chatChannelId2 = msg2.body.id;

		expect(chatChannelId != null).toEqual(true);
		expect(chatChannelId2 != null).toEqual(true);
		expect(chatChannelId).not.toEqual(chatChannelId2);

		stream.close();
		server.close();
	});

	test('Connection#send', async () => {
		const server = new WS('wss://misskey.test/streaming');
		const stream = createStream();

		const chat = stream.useChannel('chat', { other: 'aaa' });
		chat.send('read', { id: 'aaa' });

		const ws = await server.connected;
		expect(new URLSearchParams(new URL(ws.url).search).get('i')).toEqual('TOKEN');

		const connectMsg = JSON.parse(await server.nextMessage as string);
		const channelId = connectMsg.body.id;
		const msg = JSON.parse(await server.nextMessage as string);

		expect(msg.type).toEqual('ch');
		expect(msg.body.id).toEqual(channelId);
		expect(msg.body.type).toEqual('read');
		expect(msg.body.body).toEqual({ id: 'aaa' });

		stream.close();
		server.close();
	});

	test('Connection#dispose', async () => {
		const server = new WS('wss://misskey.test/streaming');
		const stream = createStream();
		const mainChannelReceived: any[] = [];
		const main = stream.useChannel('main');
		main.on('meUpdated', payload => {
			mainChannelReceived.push(payload);
		});

		const ws = await server.connected;
		expect(new URLSearchParams(new URL(ws.url).search).get('i')).toEqual('TOKEN');

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

	test('reconnect() すると購読中のチャンネルを張り直す', async () => {
		const server = new WS('wss://misskey.test/streaming');
		const stream = createStream();
		stream.useChannel('main');

		await server.connected;

		const first = JSON.parse(await server.nextMessage as string);
		expect(first.type).toEqual('connect');
		expect(first.body.channel).toEqual('main');

		// 生きて見える接続を意図的に張り直す。
		stream.reconnect();

		// Pool の購読状態が戻らないと connect() が早期 return して、
		// 接続だけ張り直り購読が一つも復活しない (無言でストリームが死ぬ)。
		const second = JSON.parse(await server.nextMessage as string);
		expect(second.type).toEqual('connect');
		expect(second.body.channel).toEqual('main');
		expect(second.body.id).toEqual(first.body.id);

		stream.close();
		server.close();
	});

	test('close が配送されないまま readyState が CLOSED でも購読を張り直す', async () => {
		const stream = createFrozenStream();
		stream.useChannel('main');

		const first = await nthSocket(0);
		first.acceptConnection();
		await vi.waitFor(() => expect(first.sentMessages).toHaveLength(1));
		expect(first.sentMessages[0].body.channel).toEqual('main');

		// サスペンドしたデバイスが残す状態: readyState は CLOSED だが close は未配送。
		// ReconnectingWebSocket はこの経路で close を配送せずに繋ぎ直し、
		// 直後の _connect() がキュー済みの close も捨てる。
		first.dieWithoutCloseEvent();

		stream.reconnect();

		const second = await nthSocket(1);
		second.acceptConnection();

		// Stream 側で自分から閉じないと state が 'connected' のまま残り、
		// 再購読の分岐を通らないのでここが空になる。
		await vi.waitFor(() => expect(second.sentMessages).toHaveLength(1));
		expect(second.sentMessages[0].type).toEqual('connect');
		expect(second.sentMessages[0].body.channel).toEqual('main');
	});

	test('reconnect() による切断は利用者に通知しない', async () => {
		const server = new WS('wss://misskey.test/streaming');
		const stream = createStream();
		let disconnected = 0;
		stream.on('_disconnected_', () => { disconnected++; });

		await server.connected;

		stream.reconnect();

		// 出すと、アプリを前面に戻すたびにリロード / ダイアログ / バナーが走る。
		expect(disconnected).toEqual(0);

		stream.close();
		server.close();
	});

	test('サーバー側からの切断は通知する', async () => {
		const server = new WS('wss://misskey.test/streaming');
		const stream = createStream();
		let disconnected = 0;
		stream.on('_disconnected_', () => { disconnected++; });

		await server.connected;

		server.close();

		await vi.waitFor(() => expect(disconnected).toEqual(1));
	});

	test('張り直せないまま猶予を過ぎたら通常の切断として通知する', async () => {
		const stream = createFrozenStream();
		let disconnected = 0;
		stream.on('_disconnected_', () => { disconnected++; });

		const first = await nthSocket(0);
		first.acceptConnection();
		first.dieWithoutCloseEvent();

		vi.useFakeTimers();
		try {
			stream.reconnect();
			expect(disconnected).toEqual(0);

			// 2 本目以降のソケットは open しない (= 繋ぎ直せない)。黙ったままだと
			// サーバーが落ちているときに何の表示も出ず、直しに来た症状に戻る。
			vi.advanceTimersByTime(30 * 1000);
			expect(disconnected).toEqual(1);
		} finally {
			vi.useRealTimers();
		}
	});

	test('張り直しに成功すれば猶予を過ぎても通知しない', async () => {
		const stream = createFrozenStream();
		let disconnected = 0;
		stream.on('_disconnected_', () => { disconnected++; });

		const first = await nthSocket(0);
		first.acceptConnection();
		first.dieWithoutCloseEvent();

		stream.reconnect();

		const second = await nthSocket(1);
		second.acceptConnection();

		vi.useFakeTimers();
		try {
			vi.advanceTimersByTime(120 * 1000);
			expect(disconnected).toEqual(0);
		} finally {
			vi.useRealTimers();
		}
	});

	test('張り直しに成功したあとの本物の切断は通知する', async () => {
		const stream = createFrozenStream();
		let disconnected = 0;
		stream.on('_disconnected_', () => { disconnected++; });

		const first = await nthSocket(0);
		first.acceptConnection();
		first.dieWithoutCloseEvent();

		stream.reconnect();

		const second = await nthSocket(1);
		second.acceptConnection();
		expect(disconnected).toEqual(0);

		// 抑止フラグが下りていないと、以降どんな切断も黙って捨てられる。
		// 一度でも復帰を挟んだタブは、その後サーバーが落ちても無表示になる。
		second.dieWithCloseEvent();

		await vi.waitFor(() => expect(disconnected).toEqual(1));
	});

	test('張り直しに成功したら、残った猶予タイマーで二重に通知しない', async () => {
		vi.useFakeTimers();
		try {
			const stream = createFrozenStream();
			let disconnected = 0;
			stream.on('_disconnected_', () => { disconnected++; });

			// ReconnectingWebSocket は _wait() 経由でソケットを作るので、
			// 0ms 進めて生成させる。
			await vi.advanceTimersByTimeAsync(0);
			FrozenWebSocket.instances[0].acceptConnection();

			FrozenWebSocket.instances[0].dieWithoutCloseEvent();
			stream.reconnect();
			await vi.advanceTimersByTimeAsync(0);
			FrozenWebSocket.instances[1].acceptConnection();

			// 繋ぎ直せたので猶予は用済み。ここで本物の切断が来る。
			FrozenWebSocket.instances[1].dieWithCloseEvent();
			expect(disconnected).toEqual(1);

			// 張り直しのときに張った猶予タイマーを解除していないと、
			// ここで同じ切断がもう一度通知される (リロードが二度走る)。
			await vi.advanceTimersByTimeAsync(60 * 1000);
			expect(disconnected).toEqual(1);
		} finally {
			vi.useRealTimers();
		}
	});

	// TODO: SharedConnection#dispose して一定時間経ったら disconnect メッセージがサーバーに送られてくるかのテスト

	// TODO: チャンネル接続が使いまわされるかのテスト
});
