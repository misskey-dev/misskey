import { EventEmitter } from 'eventemitter3';
import * as uuid from 'uuid';
import Connection from './stream';

/**
 * ストリーム接続を管理するクラス
 * 複数の場所から同じストリームを利用する際、接続をまとめたりする
 */
export default abstract class StreamManager<T extends Connection> extends EventEmitter {
	private _connection: T = null;

	/**
	 * コネクションを必要としているユーザー
	 */
	private users = [];

	protected set connection(connection: T) {
		this._connection = connection;

		if (this._connection == null) {
			this.emit('disconnected');
		} else {
			this.emit('connected', this._connection);
		}
	}

	protected get connection() {
		return this._connection;
	}

	/**
	 * コネクションを持っているか否か
	 */
	public get hasConnection() {
		return this._connection != null;
	}

	/**
	 * コネクションを要求します
	 */
	public abstract getConnection(): T;

	public borrow() {
		return this._connection;
	}

	/**
	 * コネクションを要求するためのユーザーIDを発行します
	 */
	public use() {
		// ユーザーID生成
		const userId = uuid();

		this.users.push(userId);

		return userId;
	}

	/**
	 * コネクションを利用し終わってもう必要ないことを通知します
	 * @param userId use で発行したユーザーID
	 */
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
