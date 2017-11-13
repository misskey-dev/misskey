import * as uuid from 'uuid';
import Connection from './stream';

export default abstract class StreamManager<T extends Connection> {
	protected connection: T = null;

	/**
	 * コネクションを必要としているユーザー
	 */
	private users = [];

	public abstract getConnection(): T;

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
