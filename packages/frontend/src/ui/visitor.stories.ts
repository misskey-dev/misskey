/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import visitor_ from './visitor.vue';
const meta = {
	title: 'ui/visitor',
	component: visitor_,
} satisfies Meta<typeof visitor_>;
export const Default = {
	render(args) {
		return {
			components: {
				visitor_,
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
			template: '<visitor_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof visitor_>;
export default meta;
