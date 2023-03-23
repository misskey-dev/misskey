/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import ads_ from './ads.vue';
const meta = {
	title: 'pages/ads',
	component: ads_,
} satisfies Meta<typeof ads_>;
export const Default = {
	render(args) {
		return {
			components: {
				ads_,
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
			template: '<ads_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof ads_>;
export default meta;
