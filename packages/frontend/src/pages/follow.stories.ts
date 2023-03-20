import { Meta, StoryObj } from '@storybook/vue3';
import follow from './follow.vue';
const meta = {
	title: 'pages/follow',
	component: follow,
} satisfies Meta<typeof follow>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				follow,
			},
			props: Object.keys(argTypes),
			template: '<follow v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof follow>;
export default meta;
