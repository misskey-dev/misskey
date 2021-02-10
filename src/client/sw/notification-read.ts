import { get } from "idb-keyval";
import { pushNotificationData } from '../../types';

type Accounts = {
    [x: string]: {
        queue: string[],
        timeout: number | null,
        token: string,
    }
};

class SwNotificationRead {
	private accounts: Accounts = {};

    public async construct() {
        const accounts = await get('accounts') as { i: string, id: string }[];
        if (accounts) Error('Account is not recorded');

		this.accounts = accounts.reduce((acc, e) => {
            acc[e.id] = {
                queue: [],
                timeout: null,
                token: e.i,
            };
            return acc;
        }, {} as Accounts);

        return this;
    }

	// プッシュ通知の既読をサーバーに送信
	public async read(data: pushNotificationData) {
        if (data.type !== 'notification' || !(data.userId in this.accounts)) return;

        const account = this.accounts[data.userId]

        account.queue.push(data.body.id)

        // 最後の呼び出しから100ms待ってまとめて処理する
		if (account.timeout) clearTimeout(account.timeout);
		account.timeout = setTimeout(() => {
			account.timeout = null;

            console.info(account.token, account.queue)
			fetch(`${location.origin}/api/notifications/read`, {
				method: 'POST',
				body: JSON.stringify({
					i: account.token,
					notificationIds: account.queue
				})
			});
		}, 100);
	}
}

export const swNotificationRead = (new SwNotificationRead()).construct();
