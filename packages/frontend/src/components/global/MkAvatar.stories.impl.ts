/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-duplicates */
import { StoryObj } from '@storybook/vue3';
import { userDetailed } from '../../../.storybook/fakes';
import MkAvatar from './MkAvatar.vue';
export const Default = {
	render(args) {
		return {
			components: {
				MkAvatar,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...args,
					};
				},
			},
			template: '<MkAvatar v-bind="props" />',
		};
	},
	args: {
		size: 48,
		user: userDetailed,
	},
	decorators: [
		(Story, context) => ({
			// eslint-disable-next-line quotes
			template: `<div :style="{ display: 'grid', width: '${context.args.size}px', height: '${context.args.size}px' }"><story/></div>`,
		}),
	],
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkAvatar>;
export const ProfilePage = {
	...Default,
	args: {
		...Default.args,
		size: 120,
		indicator: true,
	},
};
export const ProfilePageCat = {
	...ProfilePage,
	args: {
		...ProfilePage.args,
		user: {
			...userDetailed,
			isCat: true,
		},
	},
};
