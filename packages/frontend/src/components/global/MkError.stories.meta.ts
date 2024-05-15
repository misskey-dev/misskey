/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Meta } from '@storybook/vue3';
import MkError from './MkError.vue';

export const argTypes = {
	onRetry: {
		action: 'retry',
	},
} satisfies Meta<typeof MkError>['argTypes'];
