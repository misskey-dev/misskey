/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { StoryObj } from '@storybook/vue3';
import { rest } from 'msw';
import { userDetailed, inviteCode } from '../../.storybook/fakes';
import { commonHandlers } from '../../.storybook/mocks';
import MkInviteCode from './MkInviteCode.vue';

export const Default = {
	render(args) {
		return {
			components: {
				MkInviteCode,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...this.args,
					};
				},
			},
			template: '<MkInviteCode v-bind="props" />',
		};
	},
	args: {
		invite: inviteCode() as any,
	},
	parameters: {
		layout: 'centered',
		msw: {
			handlers: [
				...commonHandlers,
				rest.post('/api/users/show', (req, res, ctx) => {
					return res(ctx.json(userDetailed(req.params.userId as string)));
				}),
			],
		},
	},
	decorators: [() => ({
		template: '<div style="width:100cqmin"><story/></div>',
	})],
} satisfies StoryObj<typeof MkInviteCode>;

export const Used = {
	...Default,
	args: {
		invite: inviteCode(true) as any,
	},
} satisfies StoryObj<typeof MkInviteCode>;

export const Expired = {
	...Default,
	args: {
		invite: inviteCode(false, true, true) as any,
	},
} satisfies StoryObj<typeof MkInviteCode>;
