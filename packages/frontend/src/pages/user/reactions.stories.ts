import { Meta, StoryObj } from '@storybook/vue3';
import reactions from './reactions.vue';
const meta = {
	title: 'pages/user/reactions',
	component: reactions,
} satisfies Meta<typeof reactions>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				reactions,
			},
			props: Object.keys(argTypes),
			template: '<reactions v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof reactions>;
export default meta;
