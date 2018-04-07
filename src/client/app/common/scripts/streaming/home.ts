import * as merge from 'object-assign-deep';

import Stream from './stream';
import StreamManager from './stream-manager';
import MiOS from '../../mios';

/**
 * Home stream connection
 */
export class HomeStream extends Stream {
	constructor(os: MiOS, me) {
		super(os, '', {
			i: me.token
		});

		// 最終利用日時を更新するため定期的にaliveメッセージを送信
		setInterval(() => {
			this.send({ type: 'alive' });
			me.lastUsedAt = new Date();
		}, 1000 * 60);

		// 自分の情報が更新されたとき
		this.on('i_updated', i => {
			if (os.debug) {
				console.log('I updated:', i);
			}
			merge(me, i);
		});

		// トークンが再生成されたとき
		// このままではAPIが利用できないので強制的にサインアウトさせる
		this.on('my_token_regenerated', () => {
			alert('%i18n:common.my-token-regenerated%');
			os.signout();
		});
	}
}

export class HomeStreamManager extends StreamManager<HomeStream> {
	private me;
	private os: MiOS;

	constructor(os: MiOS, me) {
		super();

		this.me = me;
		this.os = os;
	}

	public getConnection() {
		if (this.connection == null) {
			this.connection = new HomeStream(this.os, this.me);
		}

		return this.connection;
	}
}
