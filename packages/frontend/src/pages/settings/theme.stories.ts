import { Meta, StoryObj } from '@storybook/vue3';
import theme from './theme.vue';
const meta = {
	title: 'pages/settings/theme',
	component: theme,
} satisfies Meta<typeof theme>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				theme,
			},
			props: Object.keys(argTypes),
			template: '<theme v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof theme>;
export default meta;
