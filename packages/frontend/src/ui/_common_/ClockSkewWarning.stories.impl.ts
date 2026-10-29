/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { onUnmounted } from 'vue';
import type { StoryObj } from '@storybook/vue3';
import ClockSkewWarning from './ClockSkewWarning.vue';
import { clockSkewWarningVisible } from '@/utility/check-clock-skew.js';

export const Default = {
	render() {
		return {
			components: { ClockSkewWarning },
			setup() {
				clockSkewWarningVisible.value = true;
				onUnmounted(() => { clockSkewWarningVisible.value = false; });
			},
			template: '<ClockSkewWarning/>',
		};
	},
	parameters: { layout: 'fullscreen' },
} satisfies StoryObj<typeof ClockSkewWarning>;

export const Mobile = {
	...Default,
	render() {
		return {
			components: { ClockSkewWarning },
			setup() {
				clockSkewWarningVisible.value = true;
				onUnmounted(() => { clockSkewWarningVisible.value = false; });
			},
			template: '<div style="width: 375px; max-width: 100%;"><ClockSkewWarning/></div>',
		};
	},
} satisfies StoryObj<typeof ClockSkewWarning>;
