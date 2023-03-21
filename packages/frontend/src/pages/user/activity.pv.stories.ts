/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import activity_pv from './activity.pv.vue';
const meta = {
	title: 'pages/user/activity.pv',
	component: activity_pv,
} satisfies Meta<typeof activity_pv>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				activity_pv,
			},
			props: Object.keys(argTypes),
			template: '<activity_pv v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof activity_pv>;
export default meta;
