/// <reference types="vue/macros-global" />

import type { $i } from '@/account';
import type { instance } from '@/instance';
import type { i18n } from '@/i18n';

declare module 'vue' {
	interface ComponentCustomProperties {
		$i: typeof $i;
		$t: typeof i18n['t'];
		$ts: typeof i18n['ts'];
	}
}
