import { Meta, StoryObj } from '@storybook/vue3';
import follow_ from './follow.vue';
const meta = {
	title: 'pages/follow',
	component: follow_,
} satisfies Meta<typeof follow_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				follow_,
			},
			props: Object.keys(argTypes),
			template: '<follow_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof follow_>;
export default meta;
