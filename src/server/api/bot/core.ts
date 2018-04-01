import * as EventEmitter from 'events';
import * as bcrypt from 'bcryptjs';

import User, { IUser, init as initUser, ILocalUser } from '../../../models/user';

import getPostSummary from '../../../misc/get-post-summary';
import getUserSummary from '../../../misc/user/get-summary';
import parseAcct from '../../../misc/user/parse-acct';
import getNotificationSummary from '../../../misc/get-notification-summary';

const hmm = [
	'？',
	'ふぅ～む...？',
	'ちょっと何言ってるかわからないです',
	'「ヘルプ」と言うと利用可能な操作が確認できますよ'
];

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

	public async q(query: string): Promise<string> {
		if (this.context != null) {
			return await this.context.q(query);
		}

		if (/^@[a-zA-Z0-9_]+$/.test(query)) {
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
					'no: 通知を見ます\n' +
					'@<ユーザー名>: ユーザーを表示します\n' +
					'\n' +
					'タイムラインや通知を見た後、「次」というとさらに遡ることができます。';

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
				if (this.user == null) return 'まずサインインしてください。';
				this.setContext(new TlContext(this));
				return await this.context.greet();

			case 'no':
			case 'notifications':
			case '通知':
				if (this.user == null) return 'まずサインインしてください。';
				this.setContext(new NotificationsContext(this));
				return await this.context.greet();

			case 'guessing-game':
			case '数当てゲーム':
				this.setContext(new GuessingGameContext(this));
				return await this.context.greet();

			default:
				return hmm[Math.floor(Math.random() * hmm.length)];
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

	public async showUserCommand(q: string): Promise<string> {
		try {
			const user = await require('../endpoints/users/show')(parseAcct(q.substr(1)), this.user);

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
		if (data.type == 'guessing-game') return GuessingGameContext.import(bot, data.content);
		if (data.type == 'post') return PostContext.import(bot, data.content);
		if (data.type == 'tl') return TlContext.import(bot, data.content);
		if (data.type == 'notifications') return NotificationsContext.import(bot, data.content);
		if (data.type == 'signin') return SigninContext.import(bot, data.content);
		return null;
	}
}

class SigninContext extends Context {
	private temporaryUser: ILocalUser = null;

	public async greet(): Promise<string> {
		return 'まずユーザー名を教えてください:';
	}

	public async q(query: string): Promise<string> {
		if (this.temporaryUser == null) {
			// Fetch user
			const user = await User.findOne({
				usernameLower: query.toLowerCase(),
				host: null
			}, {
				fields: {
					data: false
				}
			}) as ILocalUser;

			if (user === null) {
				return `${query}というユーザーは存在しませんでした... もう一度教えてください:`;
			} else {
				this.temporaryUser = user;
				this.emit('updated');
				return `パスワードを教えてください:`;
			}
		} else {
			// Compare password
			const same = await bcrypt.compare(query, this.temporaryUser.account.password);

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

class TlContext extends Context {
	private next: string = null;

	public async greet(): Promise<string> {
		return await this.getTl();
	}

	public async q(query: string): Promise<string> {
		if (query == '次') {
			return await this.getTl();
		} else {
			this.bot.clearContext();
			return await this.bot.q(query);
		}
	}

	private async getTl() {
		const tl = await require('../endpoints/posts/timeline')({
			limit: 5,
			untilId: this.next ? this.next : undefined
		}, this.bot.user);

		if (tl.length > 0) {
			this.next = tl[tl.length - 1].id;
			this.emit('updated');

			const text = tl
				.map(post => `${post.user.name}\n「${getPostSummary(post)}」`)
				.join('\n-----\n');

			return text;
		} else {
			return 'タイムラインに表示するものがありません...';
		}
	}

	public export() {
		return {
			type: 'tl',
			content: {
				next: this.next,
			}
		};
	}

	public static import(bot: BotCore, data: any) {
		const context = new TlContext(bot);
		context.next = data.next;
		return context;
	}
}

class NotificationsContext extends Context {
	private next: string = null;

	public async greet(): Promise<string> {
		return await this.getNotifications();
	}

	public async q(query: string): Promise<string> {
		if (query == '次') {
			return await this.getNotifications();
		} else {
			this.bot.clearContext();
			return await this.bot.q(query);
		}
	}

	private async getNotifications() {
		const notifications = await require('../endpoints/i/notifications')({
			limit: 5,
			untilId: this.next ? this.next : undefined
		}, this.bot.user);

		if (notifications.length > 0) {
			this.next = notifications[notifications.length - 1].id;
			this.emit('updated');

			const text = notifications
				.map(notification => getNotificationSummary(notification))
				.join('\n-----\n');

			return text;
		} else {
			return '通知はありません';
		}
	}

	public export() {
		return {
			type: 'notifications',
			content: {
				next: this.next,
			}
		};
	}

	public static import(bot: BotCore, data: any) {
		const context = new NotificationsContext(bot);
		context.next = data.next;
		return context;
	}
}

class GuessingGameContext extends Context {
	private secret: number;
	private history: number[] = [];

	public async greet(): Promise<string> {
		this.secret = Math.floor(Math.random() * 100);
		this.emit('updated');
		return '0~100の秘密の数を当ててみてください:';
	}

	public async q(query: string): Promise<string> {
		if (query == 'やめる') {
			this.bot.clearContext();
			return 'やめました。';
		}

		const guess = parseInt(query, 10);

		if (isNaN(guess)) {
			return '整数で推測してください。「やめる」と言うとゲームをやめます。';
		}

		const firsttime = this.history.indexOf(guess) === -1;

		this.history.push(guess);
		this.emit('updated');

		if (this.secret < guess) {
			return firsttime ? `${guess}よりも小さいですね` : `もう一度言いますが${guess}より小さいですよ`;
		} else if (this.secret > guess) {
			return firsttime ? `${guess}よりも大きいですね` : `もう一度言いますが${guess}より大きいですよ`;
		} else {
			this.bot.clearContext();
			return `正解です🎉 (${this.history.length}回目で当てました)`;
		}
	}

	public export() {
		return {
			type: 'guessing-game',
			content: {
				secret: this.secret,
				history: this.history
			}
		};
	}

	public static import(bot: BotCore, data: any) {
		const context = new GuessingGameContext(bot);
		context.secret = data.secret;
		context.history = data.history;
		return context;
	}
}
