/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import page_textarea_input from './page.textarea-input.vue';
const meta = {
	title: 'components/page/page.textarea-input',
	component: page_textarea_input,
} satisfies Meta<typeof page_textarea_input>;
export const Default = {
	render(args) {
		return {
			components: {
				page_textarea_input,
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
			template: '<page_textarea_input v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof page_textarea_input>;
export default meta;
