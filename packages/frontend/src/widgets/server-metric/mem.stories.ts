/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import mem_ from './mem.vue';
const meta = {
	title: 'widgets/server-metric/mem',
	component: mem_,
} satisfies Meta<typeof mem_>;
export const Default = {
	render(args) {
		return {
			components: {
				mem_,
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
			template: '<mem_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof mem_>;
export default meta;
