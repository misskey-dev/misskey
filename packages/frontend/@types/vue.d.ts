/// <reference types="vue/macros-global" />

import type { i18n } from '@/i18n';

declare module 'vue' {
	interface ComponentCustomProperties {
		$t: typeof i18n['t'];
		$ts: typeof i18n['ts'];
	}
}
