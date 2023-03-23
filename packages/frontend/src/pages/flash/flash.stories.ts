/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import flash_ from './flash.vue';
const meta = {
	title: 'pages/flash/flash',
	component: flash_,
} satisfies Meta<typeof flash_>;
export const Default = {
	render(args) {
		return {
			components: {
				flash_,
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
			template: '<flash_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof flash_>;
export default meta;
