/// <reference types="vue/macros-global" />

import type { $i } from '@/account';
import type { defaultStore } from '@/store';
import type { instance } from '@/instance';
import type { i18n } from '@/i18n';

declare module 'vue' {
	interface ComponentCustomProperties {
		$i: typeof $i;
		$store: typeof defaultStore;
		$instance: typeof instance;
		$t: typeof i18n['t'];
		$ts: typeof i18n['ts'];
	}
}
