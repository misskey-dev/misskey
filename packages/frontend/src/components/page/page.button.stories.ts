/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import page_button from './page.button.vue';
const meta = {
	title: 'components/page/page.button',
	component: page_button,
} satisfies Meta<typeof page_button>;
export const Default = {
	render(args) {
		return {
			components: {
				page_button,
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
			template: '<page_button v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof page_button>;
export default meta;
