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

		if (ev.data.type !== 'order') return;

		if (ev.data.loginId !== $i?.id) {
			return getAccountFromId(ev.data.loginId).then(account => {
				if (!account) return;
				return login(account.token, ev.data.url);
			});
		}

		switch (ev.data.order) {
			case 'post':
				return post(ev.data.options);
			case 'push':
				if (router.currentRoute.value.path === ev.data.url) {
					return window.scroll({ top: 0, behavior: 'smooth' });
				}
				if (navHook) {
					return navHook(ev.data.url);
				}
				if (sideViewHook && defaultStore.state.defaultSideView && ev.data.url !== '/') {
					return sideViewHook(ev.data.url);
				}
				return router.push(ev.data.url);
			default:
				return;
		}
	});
}
