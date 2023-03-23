/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import plugin_ from './plugin.vue';
const meta = {
	title: 'pages/settings/plugin',
	component: plugin_,
} satisfies Meta<typeof plugin_>;
export const Default = {
	render(args) {
		return {
			components: {
				plugin_,
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
			template: '<plugin_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof plugin_>;
export default meta;
