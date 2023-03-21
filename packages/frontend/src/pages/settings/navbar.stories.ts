import { Meta, StoryObj } from '@storybook/vue3';
import navbar_ from './navbar.vue';
const meta = {
	title: 'pages/settings/navbar',
	component: navbar_,
} satisfies Meta<typeof navbar_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				navbar_,
			},
			props: Object.keys(argTypes),
			template: '<navbar_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof navbar_>;
export default meta;
