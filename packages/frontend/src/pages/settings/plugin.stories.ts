import { Meta, StoryObj } from '@storybook/vue3';
import plugin_ from './plugin.vue';
const meta = {
	title: 'pages/settings/plugin',
	component: plugin_,
} satisfies Meta<typeof plugin_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				plugin_,
			},
			props: Object.keys(argTypes),
			template: '<plugin_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof plugin_>;
export default meta;
