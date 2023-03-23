/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import header_ from './header.vue';
const meta = {
	title: 'ui/visitor/header',
	component: header_,
} satisfies Meta<typeof header_>;
export const Default = {
	render(args) {
		return {
			components: {
				header_,
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
			template: '<header_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof header_>;
export default meta;
