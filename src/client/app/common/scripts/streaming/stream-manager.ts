import { EventEmitter } from 'eventemitter3';
import * as uuid from 'uuid';
import Connection from './stream';

/**
 * ストリーム接続を管理するクラス
 * 複数の場所から同じストリームを利用する際、接続をまとめたりする
 */
export default abstract class StreamManager<T extends Connection> extends EventEmitter {
	private _connection: T = null;

	private disposeTimerId: any;

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

			this._connection.on('_connected_', () => {
				this.emit('_connected_');
			});

			this._connection.on('_disconnected_', () => {
				this.emit('_disconnected_');
			});

			this._connection.user = 'Managed';
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

	public get state(): string {
		if (!this.hasConnection) return 'no-connection';
		return this._connection.state;
	}

	/**
	 * コネクションを要求します
	 */
	public abstract getConnection(): T;

	/**
	 * 現在接続しているコネクションを取得します
	 */
	public borrow() {
		return this._connection;
	}

	/**
	 * コネクションを要求するためのユーザーIDを発行します
	 */
	public use() {
		// タイマー解除
		if (this.disposeTimerId) {
			clearTimeout(this.disposeTimerId);
			this.disposeTimerId = null;
		}

		// ユーザーID生成
		const userId = uuid();

		this.users.push(userId);

		this._connection.user = `Managed (${ this.users.length })`;

		return userId;
	}

	/**
	 * コネクションを利用し終わってもう必要ないことを通知します
	 * @param userId use で発行したユーザーID
	 */
	public dispose(userId) {
		this.users = this.users.filter(id => id != userId);

		this._connection.user = `Managed (${ this.users.length })`;

		// 誰もコネクションの利用者がいなくなったら
		if (this.users.length == 0) {
			// また直ぐに再利用される可能性があるので、一定時間待ち、
			// 新たな利用者が現れなければコネクションを切断する
			this.disposeTimerId = setTimeout(() => {
				this.disposeTimerId = null;

				this.connection.close();
				this.connection = null;
			}, 3000);
		}
	}
}
