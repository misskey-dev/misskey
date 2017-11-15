/**
 * Desktop Client
 */

// Style
import './style.styl';

require('./tags');
require('./mixins');
import * as riot from 'riot';
import init from '../init';
import route from './router';
import fuckAdBlock from './scripts/fuck-ad-block';
import getPostSummary from '../../../common/get-post-summary';
import MiOS from '../common/mios';

/**
 * init
 */
init(async (mios: MiOS) => {
	/**
	 * Fuck AD Block
	 */
	fuckAdBlock();

	/**
	 * Init Notification
	 */
	if ('Notification' in window) {
		// 許可を得ていなかったらリクエスト
		if ((Notification as any).permission == 'default') {
			await Notification.requestPermission();
		}

		if ((Notification as any).permission == 'granted') {
			registerNotifications(mios.stream);
		}
	}

	// Start routing
	route(mios);
});

function registerNotifications(stream) {
	if (stream == null) return;

	stream.on('drive_file_created', file => {
		const n = new Notification('ファイルがアップロードされました', {
			body: file.name,
			icon: file.url + '?thumbnail&size=64'
		});
		setTimeout(n.close.bind(n), 5000);
	});

	stream.on('mention', post => {
		const n = new Notification(`${post.user.name}さんから:`, {
			body: getPostSummary(post),
			icon: post.user.avatar_url + '?thumbnail&size=64'
		});
		setTimeout(n.close.bind(n), 6000);
	});

	stream.on('reply', post => {
		const n = new Notification(`${post.user.name}さんから返信:`, {
			body: getPostSummary(post),
			icon: post.user.avatar_url + '?thumbnail&size=64'
		});
		setTimeout(n.close.bind(n), 6000);
	});

	stream.on('quote', post => {
		const n = new Notification(`${post.user.name}さんが引用:`, {
			body: getPostSummary(post),
			icon: post.user.avatar_url + '?thumbnail&size=64'
		});
		setTimeout(n.close.bind(n), 6000);
	});

	stream.on('unread_messaging_message', message => {
		const n = new Notification(`${message.user.name}さんからメッセージ:`, {
			body: message.text, // TODO: getMessagingMessageSummary(message),
			icon: message.user.avatar_url + '?thumbnail&size=64'
		});
		n.onclick = () => {
			n.close();
			(riot as any).mount(document.body.appendChild(document.createElement('mk-messaging-room-window')), {
				user: message.user
			});
		};
		setTimeout(n.close.bind(n), 7000);
	});
}
