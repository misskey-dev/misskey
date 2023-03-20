import { Meta, StoryObj } from '@storybook/vue3';
import federation from './federation.vue';
const meta = {
	title: 'pages/admin/federation',
	component: federation,
} satisfies Meta<typeof federation>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				federation,
			},
			props: Object.keys(argTypes),
			template: '<federation v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof federation>;
export default meta;
