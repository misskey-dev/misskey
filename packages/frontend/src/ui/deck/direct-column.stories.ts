/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import direct_column from './direct-column.vue';
const meta = {
	title: 'ui/deck/direct-column',
	component: direct_column,
} satisfies Meta<typeof direct_column>;
export const Default = {
	render(args) {
		return {
			components: {
				direct_column,
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
			template: '<direct_column v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof direct_column>;
export default meta;
