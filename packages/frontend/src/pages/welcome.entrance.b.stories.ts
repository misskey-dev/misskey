/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import welcome_entrance_b from './welcome.entrance.b.vue';
const meta = {
	title: 'pages/welcome.entrance.b',
	component: welcome_entrance_b,
} satisfies Meta<typeof welcome_entrance_b>;
export const Default = {
	render(args) {
		return {
			components: {
				welcome_entrance_b,
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
			template: '<welcome_entrance_b v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof welcome_entrance_b>;
export default meta;
