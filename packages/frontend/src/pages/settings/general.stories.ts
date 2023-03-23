/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import general_ from './general.vue';
const meta = {
	title: 'pages/settings/general',
	component: general_,
} satisfies Meta<typeof general_>;
export const Default = {
	render(args) {
		return {
			components: {
				general_,
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
			template: '<general_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof general_>;
export default meta;
