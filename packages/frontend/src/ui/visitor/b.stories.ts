/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import b_ from './b.vue';
const meta = {
	title: 'ui/visitor/b',
	component: b_,
} satisfies Meta<typeof b_>;
export const Default = {
	render(args) {
		return {
			components: {
				b_,
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
			template: '<b_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof b_>;
export default meta;
