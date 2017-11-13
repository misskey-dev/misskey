'use strict';

import Stream from './stream';
import signout from './signout';

/**
 * Home stream connection
 */
class Connection extends Stream {
	constructor(me) {
		super('', {
			i: me.token
		});

		// 最終利用日時を更新するため定期的にaliveメッセージを送信
		setInterval(() => {
			this.send({ type: 'alive' });
		}, 1000 * 60);

		(this as any).on('i_updated', me.update);

		(this as any).on('my_token_regenerated', () => {
			alert('%i18n:common.my-token-regenerated%');
			signout();
		});
	}
}

export default Connection;
