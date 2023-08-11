import { computed, createApp, watch, markRaw, version as vueVersion, defineAsyncComponent } from 'vue';
import { common } from './common';

export async function subBoot() {
	const { isClientUpdated } = await common(() => createApp(
		defineAsyncComponent(() => import('@/ui/minimum.vue')),
	));
}
