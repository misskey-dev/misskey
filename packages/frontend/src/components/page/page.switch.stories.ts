/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import page_switch from './page.switch.vue';
const meta = {
	title: 'components/page/page.switch',
	component: page_switch,
} satisfies Meta<typeof page_switch>;
export const Default = {
	render(args) {
		return {
			components: {
				page_switch,
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
			template: '<page_switch v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof page_switch>;
export default meta;
