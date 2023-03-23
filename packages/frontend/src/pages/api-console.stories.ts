/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import api_console from './api-console.vue';
const meta = {
	title: 'pages/api-console',
	component: api_console,
} satisfies Meta<typeof api_console>;
export const Default = {
	render(args) {
		return {
			components: {
				api_console,
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
			template: '<api_console v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof api_console>;
export default meta;
