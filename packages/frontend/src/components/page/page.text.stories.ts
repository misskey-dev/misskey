/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import page_text from './page.text.vue';
const meta = {
	title: 'components/page/page.text',
	component: page_text,
} satisfies Meta<typeof page_text>;
export const Default = {
	render(args) {
		return {
			components: {
				page_text,
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
			template: '<page_text v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof page_text>;
export default meta;
