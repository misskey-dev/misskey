/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import welcome_ from './welcome.vue';
const meta = {
	title: 'pages/welcome',
	component: welcome_,
} satisfies Meta<typeof welcome_>;
export const Default = {
	render(args) {
		return {
			components: {
				welcome_,
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
			template: '<welcome_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof welcome_>;
export default meta;
