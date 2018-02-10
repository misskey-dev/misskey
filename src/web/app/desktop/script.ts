/**
 * Desktop Client
 */

// Style
import './style.styl';

import Vue from 'vue';
import init from '../init';
import fuckAdBlock from './scripts/fuck-ad-block';
import MiOS from '../common/mios';
import HomeStreamManager from '../common/scripts/streaming/home-stream-manager';
import composeNotification from '../common/scripts/compose-notification';

import MkIndex from './tags/pages/index.vue';

/**
 * init
 */
init(async (mios: MiOS, app: Vue) => {
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

	app.$router.addRoutes([{
		path: '/', component: MkIndex, props: { os: mios }
	}]);
}, true);

function registerNotifications(stream: HomeStreamManager) {
	if (stream == null) return;

	if (stream.hasConnection) {
		attach(stream.borrow());
	}

	stream.on('connected', connection => {
		attach(connection);
	});

	function attach(connection) {
		connection.on('drive_file_created', file => {
			const _n = composeNotification('drive_file_created', file);
			const n = new Notification(_n.title, {
				body: _n.body,
				icon: _n.icon
			});
			setTimeout(n.close.bind(n), 5000);
		});

		connection.on('mention', post => {
			const _n = composeNotification('mention', post);
			const n = new Notification(_n.title, {
				body: _n.body,
				icon: _n.icon
			});
			setTimeout(n.close.bind(n), 6000);
		});

		connection.on('reply', post => {
			const _n = composeNotification('reply', post);
			const n = new Notification(_n.title, {
				body: _n.body,
				icon: _n.icon
			});
			setTimeout(n.close.bind(n), 6000);
		});

		connection.on('quote', post => {
			const _n = composeNotification('quote', post);
			const n = new Notification(_n.title, {
				body: _n.body,
				icon: _n.icon
			});
			setTimeout(n.close.bind(n), 6000);
		});

		connection.on('unread_messaging_message', message => {
			const _n = composeNotification('unread_messaging_message', message);
			const n = new Notification(_n.title, {
				body: _n.body,
				icon: _n.icon
			});
			n.onclick = () => {
				n.close();
				/*(riot as any).mount(document.body.appendChild(document.createElement('mk-messaging-room-window')), {
					user: message.user
				});*/
			};
			setTimeout(n.close.bind(n), 7000);
		});
	}
}
