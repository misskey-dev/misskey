import { Meta, StoryObj } from '@storybook/vue3';
import timeline from './timeline.vue';
const meta = {
	title: 'pages/timeline',
	component: timeline,
} satisfies Meta<typeof timeline>;
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
} satisfies StoryObj<typeof timeline>;
export default meta;
