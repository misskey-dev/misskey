/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EventEmitter } from 'eventemitter3';
import { BroadcastChannel } from 'broadcast-channel';

// メッセージの型定義
type TabState = {
	id: string;
	lastActiveTime: number; // ユーザーが最後に操作した時間
	lastHeartbeat: number;  // 最後に生存報告を受け取った時間
};

type BroadcastMessage = {
	type: 'HEARTBEAT' | 'UNLOAD';
	payload: {
		id: string;
		lastActiveTime: number;
	};
};

type EventTypes = {
	changeMainStatus: (isMain: boolean) => void;
	becomeMain: () => void;
	resignMain: () => void;
};

/**
 * メインタブの管理
 */
export class TabManager extends EventEmitter<EventTypes> {
	private readonly channel: BroadcastChannel<BroadcastMessage>;
	private readonly myId: string;
	private lastActiveTime: number;

	// 他のタブの状態を保持するMap
	private peers: Map<string, TabState> = new Map();

	protected isMain: boolean = false;
	private heartbeatIntervalId: number | null = null;

	// 定数設定
	private readonly BROADCAST_CHANNEL_NAME = 'tabSync';
	private readonly HEARTBEAT_INTERVAL = 1000; // 1秒ごとに定期処理
	private readonly PEER_TIMEOUT = 3000;       // 3秒連絡がなければ死亡とみなす

	constructor(tabId: string) {
		super();

		this.myId = tabId;
		this.channel = new BroadcastChannel<BroadcastMessage>(this.BROADCAST_CHANNEL_NAME);
		this.lastActiveTime = Date.now(); // 初期化時は現在時刻

		// bind this
		this.updateActivity = this.updateActivity.bind(this);

		this.init();
	}

	private init() {
		// 1. メッセージ受信設定
		this.channel.addEventListener('message', (msg) => {
			this.handleMessage(msg);
		});

		// 2. ユーザーのアクティビティ監視 (フォーカス時に時刻更新)
		window.addEventListener('focus', this.updateActivity, { passive: true });
		window.addEventListener('click', this.updateActivity, { passive: true });
		window.addEventListener('keydown', this.updateActivity, { passive: true });

		// 3. ページが閉じられる際の処理
		window.addEventListener('beforeunload', () => {
			this.broadcast('UNLOAD');
			this.destroy();
		});

		// 4. 定期処理の開始
		this.startHeartbeat();

		// 初期状態ですぐにアクティブ更新をブロードキャスト
		this.updateActivity();
	}

	/**
	 * ユーザー操作があったときに呼び出される
	 * 自身のlastActiveTimeを更新し、全タブへ通知する
	 */
	private updateActivity() {
		this.lastActiveTime = Date.now();
		this.broadcast('HEARTBEAT');
		// 操作したタイミングでリーダー再計算（自分がリーダーになるため）
		this.determineLeader();
	}

	/**
	 * メッセージをブロードキャスト
	 */
	private broadcast(type: BroadcastMessage['type']) {
		const message: BroadcastMessage = {
			type,
			payload: {
				id: this.myId,
				lastActiveTime: this.lastActiveTime,
			},
		};
		this.channel.postMessage(message);
	}

	/**
	 * 受信メッセージの処理
	 */
	private handleMessage(message: BroadcastMessage) {
		const { id, lastActiveTime } = message.payload;

		// 自分自身のメッセージは無視
		if (id === this.myId) return;

		if (message.type === 'UNLOAD') {
			this.peers.delete(id);
		} else if (message.type === 'HEARTBEAT') {
			this.peers.set(id, {
				id,
				lastActiveTime,
				lastHeartbeat: Date.now(),
			});
		}

		// 状態が変わった可能性があるのでリーダー判定を行う
		this.determineLeader();
	}

	/**
	 * 定期処理
	 *
	 * - 生存報告 (Heartbeat)
	 * - 定期的なリーダー選出
	 * - 死亡タブの掃除
	 */
	private startHeartbeat() {
		this.heartbeatIntervalId = window.setInterval(() => {
			this.broadcast('HEARTBEAT');
			this.pruneDeadPeers();
			this.determineLeader();
		}, this.HEARTBEAT_INTERVAL);
	}

	/**
	 * タイムアウトしたタブを削除する（クラッシュ対応）
	 */
	private pruneDeadPeers() {
		const now = Date.now();
		for (const [id, state] of this.peers.entries()) {
			if (now - state.lastHeartbeat > this.PEER_TIMEOUT) {
				this.peers.delete(id); // 死亡とみなしてリストから削除
			}
		}
	}

	/**
	 * リーダー決定ロジック
	 * 全タブの中で lastActiveTime が最も大きいものがリーダー
	 */
	private determineLeader() {
		// 自分を含めた全タブのリストを作成
		const allTabs: TabState[] = [
			{ id: this.myId, lastActiveTime: this.lastActiveTime, lastHeartbeat: Date.now() },
			...Array.from(this.peers.values())
		];

		// lastActiveTime の降順（新しい順）にソート。
		// 時刻が完全に同じ場合はIDで比較して順序を固定する。
		allTabs.sort((a, b) => {
			if (b.lastActiveTime !== a.lastActiveTime) {
				return b.lastActiveTime - a.lastActiveTime;
			}
			return a.id.localeCompare(b.id);
		});

		const leader = allTabs[0];
		const amILeader = leader.id === this.myId;

		if (this.isMain !== amILeader) {
			this.isMain = amILeader;
			if (window.document.hasFocus()) {
				window.requestIdleCallback(() => {
					this.onChangeStatus(this.isMain);
				}, { timeout: 100 });
			} else {
				this.onChangeStatus(this.isMain);
			}
		}
	}

	private onChangeStatus(isMain: boolean) {
		this.emit('changeMainStatus', isMain);
		if (isMain) {
			if (_DEV_) console.log('This tab became the main tab.');
			this.emit('becomeMain');
		} else {
			if (_DEV_) console.log('This tab is no longer the main tab.');
			this.emit('resignMain');
		}
	}

	/**
	 * リソースの解放
	 */
	public destroy() {
		if (this.heartbeatIntervalId != null) clearInterval(this.heartbeatIntervalId);
		window.removeEventListener('focus', this.updateActivity);
		window.removeEventListener('click', this.updateActivity);
		window.removeEventListener('keydown', this.updateActivity);
		this.channel.close();
	}
}
