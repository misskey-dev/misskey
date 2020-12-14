import { computed, reactive } from 'vue';
import { api } from './os';

// TODO: 他のタブと永続化されたstateを同期

type Instance = {
	emojis: {
		category: string;
	}[];
};

const data = localStorage.getItem('instance');

export const instance: Instance = reactive(data ? JSON.parse(data) : {
	// TODO: set default values
});

export async function fetchInstance() {
	const meta = await api('meta', {
		detail: false
	});

	for (const [k, v] of Object.entries(meta)) {
		instance[k] = v;
	}

	localStorage.setItem('instance', JSON.stringify(instance));
}

export const emojiCategories = computed(() => {
	const categories = new Set();
	for (const emoji of instance.emojis) {
		categories.add(emoji.category);
	}
	return Array.from(categories);
});

// このファイルに書きたくないけどここに書かないと何故かVeturが認識しない
declare module '@vue/runtime-core' {
	interface ComponentCustomProperties {
		$instance: typeof instance;
	}
}
