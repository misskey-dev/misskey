import { defineAsyncComponent } from 'vue';
import { store } from './store';

export function api(endpoint: string, data: Record<string, any> = {}, token?: string | null | undefined) {
	return store.dispatch('api', { endpoint, data, token });
}

export function dialog(props: Record<string, any>) {
	return store.dispatch('showDialog', {
		component: defineAsyncComponent(() => import('@/components/dialog.vue')),
		props
	});
}

export function menu(props: Record<string, any>) {
	return store.dispatch('showDialog', {
		component: defineAsyncComponent(() => import('@/components/menu.vue')),
		props
	});
}
