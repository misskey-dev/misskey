/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import activity_following from './activity.following.vue';
const meta = {
	title: 'pages/user/activity.following',
	component: activity_following,
} satisfies Meta<typeof activity_following>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				activity_following,
			},
			props: Object.keys(argTypes),
			template: '<activity_following v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof activity_following>;
export default meta;
