import * as EventEmitter from 'events';
import * as bcrypt from 'bcryptjs';

import User, { IUser, init as initUser } from '../models/user';

import getPostSummary from '../../common/get-post-summary';
import getUserSummary from '../../common/get-user-summary';

import Othello, { ai as othelloAi } from '../../common/othello';

/**
 * Botの頭脳
 */
export default class BotCore extends EventEmitter {
	public user: IUser = null;

	private context: Context = null;

	constructor(user?: IUser) {
		super();

		this.user = user;
	}

	public clearContext() {
		this.setContext(null);
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

	protected _import(data) {
		this.user = data.user ? initUser(data.user) : null;
		this.setContext(data.context ? Context.import(this, data.context) : null);
	}

	public static import(data) {
		const bot = new BotCore();
		bot._import(data);
		return bot;
	}

	public async q(query: string): Promise<string | void> {
		if (this.context != null) {
			return await this.context.q(query);
		}

		if (/^@[a-zA-Z0-9-]+$/.test(query)) {
			return await this.showUserCommand(query);
		}

		switch (query) {
			case 'ping':
				return 'PONG';

			case 'help':
			case 'ヘルプ':
				return '利用可能なコマンド一覧です:\n' +
					'help: これです\n' +
					'me: アカウント情報を見ます\n' +
					'login, signin: サインインします\n' +
					'logout, signout: サインアウトします\n' +
					'post: 投稿します\n' +
					'tl: タイムラインを見ます\n' +
					'@<ユーザー名>: ユーザーを表示します';

			case 'me':
				return this.user ? `${this.user.name}としてサインインしています。\n\n${getUserSummary(this.user)}` : 'サインインしていません';

			case 'login':
			case 'signin':
			case 'ログイン':
			case 'サインイン':
				if (this.user != null) return '既にサインインしていますよ！';
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
				return await this.tlCommand();

			case 'othello':
			case 'オセロ':
				this.setContext(new OthelloContext(this));
				return await this.context.greet();

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

	public async refreshUser() {
		this.user = await User.findOne({
			_id: this.user._id
		}, {
			fields: {
				data: false
			}
		});

		this.emit('updated');
	}

	public async tlCommand(): Promise<string | void> {
		if (this.user == null) return 'まずサインインしてください。';

		const tl = await require('../endpoints/posts/timeline')({
			limit: 5
		}, this.user);

		const text = tl
			.map(post => getPostSummary(post))
			.join('\n-----\n');

		return text;
	}

	public async showUserCommand(q: string): Promise<string | void> {
		try {
			const user = await require('../../endpoints/users/show')({
				username: q.substr(1)
			}, this.user);

			const text = getUserSummary(user);

			return text;
		} catch (e) {
			return `問題が発生したようです...: ${e}`;
		}
	}
}

abstract class Context extends EventEmitter {
	protected bot: BotCore;

	public abstract async greet(): Promise<string>;
	public abstract async q(query: string): Promise<string>;
	public abstract export(): any;

	constructor(bot: BotCore) {
		super();
		this.bot = bot;
	}

	public static import(bot: BotCore, data: any) {
		if (data.type == 'othello') return OthelloContext.import(bot, data.content);
		if (data.type == 'post') return PostContext.import(bot, data.content);
		if (data.type == 'signin') return SigninContext.import(bot, data.content);
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
					data: false
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
				this.bot.signin(this.temporaryUser);
				this.bot.clearContext();
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

	public static import(bot: BotCore, data: any) {
		const context = new SigninContext(bot);
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
		}, this.bot.user);
		this.bot.clearContext();
		return '投稿しましたよ！';
	}

	public export() {
		return {
			type: 'post'
		};
	}

	public static import(bot: BotCore, data: any) {
		const context = new PostContext(bot);
		return context;
	}
}

class OthelloContext extends Context {
	private othello: Othello = null;

	constructor(bot: BotCore) {
		super(bot);

		this.othello = new Othello();
	}

	public async greet(): Promise<string> {
		return this.othello.toPatternString('black');
	}

	public async q(query: string): Promise<string> {
		this.othello.setByNumber('black', parseInt(query, 10));
		othelloAi('white', this.othello);
		return this.othello.toPatternString('black');
	}

	public export() {
		return {
			type: 'othello',
			content: {
				board: this.othello.board
			}
		};
	}

	public static import(bot: BotCore, data: any) {
		const context = new OthelloContext(bot);
		context.othello = new Othello();
		context.othello.board = data.board;
		return context;
	}
}
