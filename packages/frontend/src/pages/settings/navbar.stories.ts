import { Meta, StoryObj } from '@storybook/vue3';
import navbar from './navbar.vue';
const meta = {
	title: 'pages/settings/navbar',
	component: navbar,
} satisfies Meta<typeof navbar>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				navbar,
			},
			props: Object.keys(argTypes),
			template: '<navbar v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof navbar>;
export default meta;
