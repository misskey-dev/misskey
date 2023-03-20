import { Meta, Story } from '@storybook/vue3';
import timeline from './timeline.vue';
const meta = {
	title: 'pages/timeline',
	component: timeline,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				timeline,
			},
			props: Object.keys(argTypes),
			template: '<timeline v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
