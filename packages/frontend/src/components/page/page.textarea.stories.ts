/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import page_textarea from './page.textarea.vue';
const meta = {
	title: 'components/page/page.textarea',
	component: page_textarea,
} satisfies Meta<typeof page_textarea>;
export const Default = {
	render(args) {
		return {
			components: {
				page_textarea,
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
			template: '<page_textarea v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof page_textarea>;
export default meta;
