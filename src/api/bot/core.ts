import * as EventEmitter from 'events';
import * as bcrypt from 'bcryptjs';

import User, { IUser, init as initUser } from '../models/user';

import getPostSummary from '../../common/get-post-summary';

export default class BotCore extends EventEmitter {
	public user: IUser = null;

	private context: Context = null;

	constructor(user?: IUser) {
		super();

		this.user = user;
	}

	public setContext(context: Context) {
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
		core.user = data.user ? initUser(data.user) : null;
		core.setContext(data.context ? Context.import(core, data.context) : null);
		return core;
	}

	public async q(query: string): Promise<string> {
		if (this.context != null) {
			return await this.context.q(query);
		}

		switch (query) {
			case 'ping':
				return 'PONG';

			case 'help':
			case 'ヘルプ':
				return 'コマンド一覧です:\n' +
					'help: これです\n' +
					'me: アカウント情報を見ます\n' +
					'login, signin: サインインします\n' +
					'logout, signout: サインアウトします\n' +
					'post: 投稿します\n' +
					'tl: タイムラインを見ます\n';

			case 'me':
				return this.user ? `${this.user.name}としてサインインしています` : 'サインインしていません';

			case 'login':
			case 'signin':
			case 'ログイン':
			case 'サインイン':
				this.setContext(new SigninContext(this));
				return await this.context.greet();

			case 'logout':
			case 'signout':
			case 'ログアウト':
			case 'サインアウト':
				if (this.user == null) return '今はサインインしてないですよ！';
				this.signout();
				return 'ご利用ありがとうございました <3';

			case 'post':
			case '投稿':
				if (this.user == null) return 'まずサインインしてください。';
				this.setContext(new PostContext(this));
				return await this.context.greet();

			case 'tl':
			case 'タイムライン':
				return await this.getTl();

				default:
				return '?';
		}
	}

	public signin(user: IUser) {
		this.user = user;
		this.emit('signin', user);
		this.emit('updated');
	}

	public signout() {
		const user = this.user;
		this.user = null;
		this.emit('signout', user);
		this.emit('updated');
	}

	public async getTl() {
		if (this.user == null) return 'まずサインインしてください。';

		const tl = await require('../endpoints/posts/timeline')({
			limit: 5
		}, this.user);

		const text = tl
			.map(post => getPostSummary(post))
			.join('\n-----\n');

		return text;
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
		if (data.type == 'post') return PostContext.import(core, data.content);
		if (data.type == 'signin') return SigninContext.import(core, data.content);
		return null;
	}
}

class SigninContext extends Context {
	private temporaryUser: IUser = null;

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
				this.core.signin(this.temporaryUser);
				this.core.setContext(null);
				return `${this.temporaryUser.name}さん、おかえりなさい！`;
			} else {
				return `パスワードが違います... もう一度教えてください:`;
			}
		}
	}

	public export() {
		return {
			type: 'signin',
			content: {
				temporaryUser: this.temporaryUser
			}
		};
	}

	public static import(core: BotCore, data: any) {
		const context = new SigninContext(core);
		context.temporaryUser = data.temporaryUser;
		return context;
	}
}

class PostContext extends Context {
	public async greet(): Promise<string> {
		return '内容:';
	}

	public async q(query: string): Promise<string> {
		await require('../endpoints/posts/create')({
			text: query
		}, this.core.user);
		this.core.setContext(null);
		return '投稿しましたよ！';
	}

	public export() {
		return {
			type: 'post'
		};
	}

	public static import(core: BotCore, data: any) {
		const context = new PostContext(core);
		return context;
	}
}
