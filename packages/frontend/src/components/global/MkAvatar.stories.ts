/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta } from '@storybook/vue3';
const meta = {
	title: 'components/global/MkAvatar',
	component: MkAvatar,
} satisfies Meta<typeof MkAvatar>;
export default meta;
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-duplicates */
import { StoryObj } from '@storybook/vue3';
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
		user: {
			avatarUrl:
				'https://github.com/misskey-dev/misskey/blob/master/packages/frontend/assets/about-icon.png?raw=true',
		},
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
		user: {
			...Default.args.user,
			onlineStatus: 'unknown',
		},
	},
};
export const ProfilePageCat = {
	...ProfilePage,
	args: {
		...ProfilePage.args,
		user: {
			...ProfilePage.args.user,
			isCat: true,
		},
	},
};
