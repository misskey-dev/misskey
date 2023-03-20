import { Meta, StoryObj } from '@storybook/vue3';
import plugin_install from './plugin.install.vue';
const meta = {
	title: 'pages/settings/plugin.install',
	component: plugin_install,
} satisfies Meta<typeof plugin_install>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				plugin_install,
			},
			props: Object.keys(argTypes),
			template: '<plugin_install v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof plugin_install>;
export default meta;
