import { ref, computed } from 'vue';
import * as os from '@/os';

type SaveData = {
	gameVersion: number;
	cookies: number;
	clicked: number;
};

export const saveData = ref<SaveData>();
export const ready = computed(() => saveData.value != null);

let prev = '';

export async function load() {
	try {
		saveData.value = await os.api('i/registry/get', {
			scope: ['clickerGame'],
			key: 'saveData',
		});
	} catch (err) {
		if (err.code === 'NO_SUCH_KEY') {
			saveData.value = {
				gameVersion: 1,
				cookies: 0,
				clicked: 0,
			};
			save();
			return;
		}
		throw err;
	}
}

export async function save() {
	const current = JSON.stringify(saveData.value);
	if (current === prev) return;

	await os.api('i/registry/set', {
		scope: ['clickerGame'],
		key: 'saveData',
		value: saveData.value,
	});

	prev = current;
}
