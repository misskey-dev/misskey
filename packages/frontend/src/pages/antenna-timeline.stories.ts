/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import antenna_timeline from './antenna-timeline.vue';
const meta = {
	title: 'pages/antenna-timeline',
	component: antenna_timeline,
} satisfies Meta<typeof antenna_timeline>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				antenna_timeline,
			},
			props: Object.keys(argTypes),
			template: '<antenna_timeline v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof antenna_timeline>;
export default meta;
