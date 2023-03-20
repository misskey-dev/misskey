import { Meta, StoryObj } from '@storybook/vue3';
import custom_css from './custom-css.vue';
const meta = {
	title: 'pages/settings/custom-css',
	component: custom_css,
} satisfies Meta<typeof custom_css>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				custom_css,
			},
			props: Object.keys(argTypes),
			template: '<custom_css v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof custom_css>;
export default meta;
