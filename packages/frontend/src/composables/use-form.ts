/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { computed, reactive, watch, toRaw } from 'vue';
import { deepEqual } from '@/utility/deep-equal.js';
import { deepClone } from '@/utility/clone.js';

export function useForm<T extends Record<string, any>>(initialState: T, save: (newState: T) => Promise<void>) {
	const currentState = reactive<T>(deepClone(initialState));
	const previousState = reactive<T>(deepClone(initialState));

	const modifiedStates = reactive<Record<keyof T, boolean>>({} as any);
	for (const key in currentState) {
		modifiedStates[key] = false;
	}
	const modified = computed(() => Object.values(modifiedStates).some(v => v));
	const modifiedCount = computed(() => Object.values(modifiedStates).filter(v => v).length);

	watch([currentState, previousState], () => {
		for (const key in modifiedStates) {
			modifiedStates[key] = !deepEqual(currentState[key], previousState[key]);
		}
	}, { deep: true });

	async function _save() {
		await save(toRaw(currentState) as T);
		for (const key in currentState) {
			previousState[key] = deepClone(currentState[key]);
		}
	}

	function discard() {
		for (const key in currentState) {
			currentState[key] = deepClone(previousState[key]);
		}
	}

	return {
		state: currentState,
		savedState: previousState,
		modifiedStates,
		modified,
		modifiedCount,
		save: _save,
		discard,
	};
}
