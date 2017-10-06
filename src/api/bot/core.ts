import * as EventEmitter from 'events';
import * as bcrypt from 'bcryptjs';

import User, { IUser } from '../models/user';

export default class BotCore extends EventEmitter {
	public user: IUser = null;

	private context: Context = null;

	constructor(user?: IUser) {
		super();

		this.user = user;
	}

	public async q(query: string): Promise<string> {
		if (this.context != null) {
			return await this.context.q(query);
		}

		switch (query) {
			case 'ping':
				return 'PONG';
			case 'ログイン':
			case 'サインイン':
				this.context = new SigninContext(this);
				return await this.context.greet();
			default:
				return '?';
		}
	}

	public setUser(user: IUser) {
		this.user = user;
		this.emit('set-user', user);
	}
}

abstract class Context {
	protected core: BotCore;

	public abstract async greet(): Promise<string>;
	public abstract async q(query: string): Promise<string>;

	constructor(core: BotCore) {
		this.core = core;
	}
}

class SigninContext extends Context {
	private temporaryUser: IUser;

	public async greet(): Promise<string> {
		return 'まずユーザー名を教えてください:';
	}

	public async q(query: string): Promise<string> {
		if (this.temporaryUser == null) {
			// Fetch user
			const user: IUser = await User.findOne({
				username_lower: query.toLowerCase()
			}, {
				fields: {
					data: false,
					profile: false
				}
			});

			if (user === null) {
				return `${query}というユーザーは存在しませんでした... もう一度教えてください:`;
			} else {
				this.temporaryUser = user;
				return `パスワードを教えてください:`;
			}
		} else {
			// Compare password
			const same = bcrypt.compareSync(query, this.temporaryUser.password);

			if (same) {
				this.core.setUser(this.temporaryUser);
				return `${this.temporaryUser.name}さん、おかえりなさい！`;
			} else {
				return `パスワードが違います... もう一度教えてください:`;
			}
		}
	}
}
