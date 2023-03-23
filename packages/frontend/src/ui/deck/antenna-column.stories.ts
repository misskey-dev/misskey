/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import antenna_column from './antenna-column.vue';
const meta = {
	title: 'ui/deck/antenna-column',
	component: antenna_column,
} satisfies Meta<typeof antenna_column>;
export const Default = {
	render(args) {
		return {
			components: {
				antenna_column,
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
			template: '<antenna_column v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof antenna_column>;
export default meta;
