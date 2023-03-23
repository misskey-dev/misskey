/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import main_column from './main-column.vue';
const meta = {
	title: 'ui/deck/main-column',
	component: main_column,
} satisfies Meta<typeof main_column>;
export const Default = {
	render(args) {
		return {
			components: {
				main_column,
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
			template: '<main_column v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof main_column>;
export default meta;
