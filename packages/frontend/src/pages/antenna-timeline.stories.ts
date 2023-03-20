import { Meta, Story } from '@storybook/vue3';
import antenna_timeline from './antenna-timeline.vue';
const meta = {
	title: 'pages/antenna-timeline',
	component: antenna_timeline,
};
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
};
export default meta;
