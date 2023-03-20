import { Meta, Story } from '@storybook/vue3';
import welcome_timeline from './welcome.timeline.vue';
const meta = {
	title: 'pages/welcome.timeline',
	component: welcome_timeline,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				welcome_timeline,
			},
			props: Object.keys(argTypes),
			template: '<welcome_timeline v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
