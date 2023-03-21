import { Meta, StoryObj } from '@storybook/vue3';
import theme_ from './theme.vue';
const meta = {
	title: 'pages/settings/theme',
	component: theme_,
} satisfies Meta<typeof theme_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				theme_,
			},
			props: Object.keys(argTypes),
			template: '<theme_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof theme_>;
export default meta;
