/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import plugin_install from './plugin.install.vue';
const meta = {
	title: 'pages/settings/plugin.install',
	component: plugin_install,
} satisfies Meta<typeof plugin_install>;
export const Default = {
	render(args) {
		return {
			components: {
				plugin_install,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...args,
					};
				},
			},
			template: '<plugin_install v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof plugin_install>;
export default meta;
