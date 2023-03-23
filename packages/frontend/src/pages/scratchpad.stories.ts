/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import scratchpad_ from './scratchpad.vue';
const meta = {
	title: 'pages/scratchpad',
	component: scratchpad_,
} satisfies Meta<typeof scratchpad_>;
export const Default = {
	render(args) {
		return {
			components: {
				scratchpad_,
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
			template: '<scratchpad_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof scratchpad_>;
export default meta;
