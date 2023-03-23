/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import mentions_column from './mentions-column.vue';
const meta = {
	title: 'ui/deck/mentions-column',
	component: mentions_column,
} satisfies Meta<typeof mentions_column>;
export const Default = {
	render(args) {
		return {
			components: {
				mentions_column,
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
			template: '<mentions_column v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof mentions_column>;
export default meta;
