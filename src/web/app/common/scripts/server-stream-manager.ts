import Connection from './server-stream';
import * as uuid from 'uuid';

export default class ServerStreamManager {
	private connection = null;

	/**
	 * コネクションを必要としているユーザー
	 */
	private users = [];

	public getConnection() {
		if (this.connection == null) {
			this.connection = new Connection();
		}

		return this.connection;
	}

	public use() {
		// ユーザーID生成
		const userId = uuid();

		this.users.push(userId);

		return userId;
	}

	public dispose(userId) {
		this.users = this.users.filter(id => id != userId);

		// 誰もコネクションの利用者がいなくなったら
		if (this.users.length == 0) {
			// コネクションを切断する
			this.connection.close();
			this.connection = null;
		}
	}
}
