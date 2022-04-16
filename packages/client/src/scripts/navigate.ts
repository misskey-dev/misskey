import { inject } from 'vue';
import { router } from '@/router';
import { defaultStore } from '@/store';

export type Navigate = (path: string, record?: boolean) => void;

export class MisskeyNavigator {
	public readonly navHook: Navigate | null = null;
	public readonly sideViewHook: Navigate | null = null;

	// It should be constructed during vue creating in order for inject function to work
	constructor() {
		this.navHook = inject<Navigate | null>('navHook', null);
		this.sideViewHook = inject<Navigate | null>('sideViewHook', null);
	}

	// Use this method instead of router.push()
	public push(path: string, record = true) {
		if (this.navHook) {
			this.navHook(path, record);
		} else {
			if (defaultStore.state.defaultSideView && this.sideViewHook && path !== '/') {
				return this.sideViewHook(path, record);
			}
	
			if (router.currentRoute.value.path === path) {
				window.scroll({ top: 0, behavior: 'smooth' });
			} else {
				if (record) router.push(path);
				else router.replace(path);
			}
		}
	}
}
