/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import statusbars_ from './statusbars.vue';
const meta = {
	title: 'ui/_common_/statusbars',
	component: statusbars_,
} satisfies Meta<typeof statusbars_>;
export const Default = {
	render(args) {
		return {
			components: {
				statusbars_,
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
			template: '<statusbars_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof statusbars_>;
export default meta;
