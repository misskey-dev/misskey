import { inject } from 'vue';
import { post } from '@/os';
import { $i, login } from '@/account';
import { defaultStore } from '@/store';
import { getAccountFromId } from '@/scripts/get-account-from-id';
import { router } from '@/router';

export function swInject() {
	const navHook = inject('navHook', null);
	const sideViewHook = inject('sideViewHook', null);

	navigator.serviceWorker.addEventListener('message', ev => {
		if (_DEV_) {
			console.log('sw msg', ev.data);
		}

		const data = ev.data; // as SwMessage
		if (data.type !== 'order') return;

		if (data.loginId !== $i?.id) {
			return getAccountFromId(data.loginId).then(account => {
				if (!account) return;
				return login(account.token, data.url);
			});
		}

		switch (data.order) {
			case 'post':
				return post(data.options);
			case 'push':
				if (router.currentRoute.value.path === data.url) {
					return window.scroll({ top: 0, behavior: 'smooth' });
				}
				if (navHook) {
					return navHook(data.url);
				}
				if (sideViewHook && defaultStore.state.defaultSideView && data.url !== '/') {
					return sideViewHook(data.url);
				}
				return router.push(data.url);
			default:
				return;
		}
	});
}
