import { get } from 'idb-keyval';
import { pushNotificationDataMap } from '@/types';
import { api } from '@/scripts/operations';

type Accounts = {
	[x: string]: {
		queue: string[],
		timeout: number | null
	}
};

class SwNotificationReadManager {
	private accounts: Accounts = {};

	public async construct() {
		const accounts = await get('accounts');
		if (!accounts) Error('Accounts are not recorded');

		this.accounts = accounts.reduce((acc, e) => {
			acc[e.id] = {
				queue: [],
				timeout: null
			};
			return acc;
		}, {} as Accounts);

		return this;
	}

	// プッシュ通知の既読をサーバーに送信
	public async read(data: pushNotificationDataMap[keyof pushNotificationDataMap]) {
		if (data.type !== 'notification' || !(data.userId in this.accounts)) return;

		const account = this.accounts[data.userId];

		account.queue.push(data.body.id as string);

		if (account.queue.length >= 20) {
			if (account.timeout) clearTimeout(account.timeout);
			const notificationIds = account.queue;
			account.queue = [];
			await api('notifications/read', data.userId, { notificationIds });
			return;
		}

		// 最後の呼び出しから200ms待ってまとめて処理する
		if (account.timeout) clearTimeout(account.timeout);
		account.timeout = setTimeout(() => {
			account.timeout = null;

			const notificationIds = account.queue;
			account.queue = [];
			api('notifications/read', data.userId, { notificationIds });
		}, 200);
	}
}

export const swNotificationRead = (new SwNotificationReadManager()).construct();
