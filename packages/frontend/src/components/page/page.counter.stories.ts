/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import page_counter from './page.counter.vue';
const meta = {
	title: 'components/page/page.counter',
	component: page_counter,
} satisfies Meta<typeof page_counter>;
export const Default = {
	render(args) {
		return {
			components: {
				page_counter,
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
			template: '<page_counter v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof page_counter>;
export default meta;
