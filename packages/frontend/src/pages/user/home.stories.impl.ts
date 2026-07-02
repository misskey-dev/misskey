/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { expect, waitFor, within } from '@storybook/test';
import { HttpResponse, http } from 'msw';
import { userDetailed } from '../../../.storybook/fakes.js';
import { commonHandlers } from '../../../.storybook/mocks.js';
import home_ from './home.vue';
import type { StoryObj } from '@storybook/vue3';
import { $i } from '@/i.js';

type UserDetailed = ReturnType<typeof userDetailed>;
type ProfileRole = UserDetailed['roles'][number] & {
	isPublicDisplayRequired?: boolean;
};
type MeRoleDisplay = NonNullable<typeof $i> & {
	hiddenRoleIds?: string[];
};

function createProfileRole(id: string, name: string, color: string, isPublicDisplayRequired = false): ProfileRole {
	return {
		id,
		name,
		color,
		iconUrl: null,
		description: `${name} description`,
		isModerator: false,
		isAdministrator: false,
		asBadge: false,
		displayOrder: 0,
		isPublicDisplayRequired,
	};
}

const visibleRole = createProfileRole('role-display-visible', 'Visible Role', '#3b82f6');
const hiddenRole = createProfileRole('role-display-hidden', 'Hidden Role', '#ef4444');
const forcedRole = createProfileRole('role-display-forced', 'Forced Role', '#22c55e', true);

const roleDisplayUser = {
	...userDetailed(),
	roles: [visibleRole, hiddenRole, forcedRole],
};

function setStoryAccount(user: UserDetailed, hiddenRoleIds: string[]): void {
	if ($i == null) return;

	Object.assign($i as MeRoleDisplay, {
		id: user.id,
		username: user.username,
		host: user.host,
		name: user.name,
		hiddenRoleIds,
	});
}

function renderHome(args: UserDetailedHomeArgs, hiddenRoleIds: string[] = []) {
	return {
		components: {
			home_,
		},
		setup() {
			setStoryAccount(args.user, hiddenRoleIds);

			return {
				props: args,
			};
		},
		template: '<home_ v-bind="props" />',
	};
}

type UserDetailedHomeArgs = {
	user: UserDetailed;
	disableNotes?: boolean;
};

export const Default = {
	render(args) {
		return renderHome(args);
	},
	args: {
		user: userDetailed(),
		disableNotes: false,
	},
	parameters: {
		layout: 'fullscreen',
		msw: {
			handlers: [
				...commonHandlers,
				http.post('/api/users/notes', () => {
					return HttpResponse.json([]);
				}),
				http.get('/api/charts/user/notes', ({ request }) => {
					const url = new URL(request.url);
					const length = Math.max(Math.min(parseInt(url.searchParams.get('limit') ?? '30', 10), 1), 300);
					return HttpResponse.json({
						total: Array.from({ length }, () => 0),
						inc: Array.from({ length }, () => 0),
						dec: Array.from({ length }, () => 0),
						diffs: {
							normal: Array.from({ length }, () => 0),
							reply: Array.from({ length }, () => 0),
							renote: Array.from({ length }, () => 0),
							withFile: Array.from({ length }, () => 0),
						},
					});
				}),
				http.get('/api/charts/user/pv', ({ request }) => {
					const url = new URL(request.url);
					const length = Math.max(Math.min(parseInt(url.searchParams.get('limit') ?? '30', 10), 1), 300);
					return HttpResponse.json({
						upv: {
							user: Array.from({ length }, () => 0),
							visitor: Array.from({ length }, () => 0),
						},
						pv: {
							user: Array.from({ length }, () => 0),
							visitor: Array.from({ length }, () => 0),
						},
					});
				}),
			],
		},
		chromatic: {
			// `XActivity` is not compatible with Chromatic for now
			disableSnapshot: true,
		},
	},
} satisfies StoryObj<typeof home_>;

export const RoleDisplayVisibility = {
	...Default,
	render(args) {
		return renderHome(args, [hiddenRole.id]);
	},
	async play({ canvasElement }) {
		const canvas = within(canvasElement);

		await expect(await canvas.findByText(visibleRole.name)).toBeInTheDocument();
		await expect(await canvas.findByText(forcedRole.name)).toBeInTheDocument();
		await waitFor(() => expect(canvas.queryByText(hiddenRole.name)).not.toBeInTheDocument());
	},
	args: {
		...Default.args,
		user: roleDisplayUser,
	},
} satisfies StoryObj<typeof home_>;
