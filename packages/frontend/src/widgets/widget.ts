/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineAsyncComponent, reactive, watch } from 'vue';
import type { Reactive } from 'vue';
import { throttle } from 'throttle-debounce';
import type { FormWithDefault, GetFormResultType } from '@/utility/form.js';
import * as os from '@/os.js';
import { deepClone } from '@/utility/clone.js';

export type Widget<P extends Record<string, unknown>> = {
	id: string;
	data: Partial<P>;
};

export type WidgetComponentProps<P extends Record<string, unknown>> = {
	widget?: Widget<P>;
};

export type WidgetComponentEmits<P extends Record<string, unknown>> = {
	(ev: 'updateProps', props: P);
};

export type WidgetComponentExpose = {
	name: string;
	id: string | null;
	configure: () => void;
};

export const useWidgetPropsManager = <F extends FormWithDefault>(
	name: string,
	propsDef: F,
	props: Readonly<WidgetComponentProps<GetFormResultType<F>>>,
	emit: WidgetComponentEmits<GetFormResultType<F>>,
): {
	widgetProps: Reactive<GetFormResultType<F>>;
	save: () => void;
	configure: () => void;
} => {
	const widgetProps = reactive<GetFormResultType<F>>((props.widget ? deepClone(props.widget.data) : {}) as GetFormResultType<F>);

	const mergeProps = () => {
		for (const prop of Object.keys(propsDef)) {
			if (typeof widgetProps[prop] === 'undefined') {
				widgetProps[prop] = propsDef[prop].default;
			}
		}
	};

	watch(widgetProps, () => {
		mergeProps();
	}, { deep: true, immediate: true });

	const save = throttle(3000, () => {
		emit('updateProps', widgetProps as GetFormResultType<F>);
	});

	const configure = async () => {
		const form = deepClone(propsDef);
		for (const item of Object.keys(form)) {
			form[item].default = widgetProps[item];
		}

		const res = await new Promise<{
			canceled: false;
			result: GetFormResultType<F>;
		} | {
			canceled: true;
		}>((resolve) => {
			const { dispose } = os.popup(defineAsyncComponent(() => import('@/components/MkWidgetSettingsDialog.vue')), {
				widgetName: name,
				form: form,
				currentSettings: widgetProps,
			}, {
				saved: (newProps: GetFormResultType<F>) => {
					resolve({ canceled: false, result: newProps });
				},
				canceled: () => {
					resolve({ canceled: true });
				},
				closed: () => {
					dispose();
				},
			});
		});

		if (res.canceled) {
			return;
		}

		for (const key of Object.keys(res.result)) {
			widgetProps[key] = res.result[key];
		}

		save();
	};

	return {
		widgetProps,
		save,
		configure,
	};
};
