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

	private setContect(context: Context) {
		this.context = context;
		this.emit('updated');

		if (context) {
			context.on('updated', () => {
				this.emit('updated');
			});
		}
	}

	public export() {
		return {
			user: this.user,
			context: this.context ? this.context.export() : null
		};
	}

	public static import(data) {
		const core = new BotCore();
		core.user = data.user;
		core.setContect(data.context ? Context.import(core, data.context) : null);
		return core;
	}

	public async q(query: string): Promise<string> {
		if (this.context != null) {
			return await this.context.q(query);
		}

		switch (query) {
			case 'ping':
				return 'PONG';
			case 'me':
				return this.user ? `${this.user.name}としてサインインしています` : 'サインインしていません';
			case 'ログイン':
			case 'サインイン':
				this.setContect(new SigninContext(this));
				return await this.context.greet();
			default:
				return '?';
		}
	}

	public setUser(user: IUser) {
		this.user = user;
		this.emit('set-user', user);
		this.emit('updated');
	}
}

abstract class Context extends EventEmitter {
	protected core: BotCore;

	public abstract async greet(): Promise<string>;
	public abstract async q(query: string): Promise<string>;
	public abstract export(): any;

	constructor(core: BotCore) {
		super();
		this.core = core;
	}

	public static import(core: BotCore, data: any) {
		if (data.type == 'signin') return SigninContext.import(core, data.content);
		return null;
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
				this.emit('updated');
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

	public export() {
		return {
			temporaryUser: this.temporaryUser
		};
	}

	public static import(core: BotCore, data: any) {
		const context = new SigninContext(core);
		context.temporaryUser = data.temporaryUser;
		return context;
	}
}
