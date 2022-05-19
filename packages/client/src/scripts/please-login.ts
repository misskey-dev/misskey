import { defineAsyncComponent } from 'vue';
import { $i } from '@/account';
import { i18n } from '@/i18n';
import { popup } from '@/os';

export function pleaseLogin(path?: string) {
	if ($i) return;

	popup(defineAsyncComponent(() => import('@/components/signin-dialog.vue')), {
		autoSet: true,
		message: i18n.ts.signinRequired
	}, {
		cancelled: () => {
			if (path) {
				window.location.href = path;
			}
		},
	}, 'closed');

	throw new Error('signin required');
}
