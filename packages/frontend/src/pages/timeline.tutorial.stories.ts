import { Meta, Story } from '@storybook/vue3';
import timeline_tutorial from './timeline.tutorial.vue';
const meta = {
	title: 'pages/timeline.tutorial',
	component: timeline_tutorial,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				timeline_tutorial,
			},
			props: Object.keys(argTypes),
			template: '<timeline_tutorial v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
