/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import clicker_ from './clicker.vue';
const meta = {
	title: 'pages/clicker',
	component: clicker_,
} satisfies Meta<typeof clicker_>;
export const Default = {
	render(args) {
		return {
			components: {
				clicker_,
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
			template: '<clicker_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof clicker_>;
export default meta;
