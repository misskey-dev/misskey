/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import explore_ from './explore.vue';
const meta = {
	title: 'pages/explore',
	component: explore_,
} satisfies Meta<typeof explore_>;
export const Default = {
	render(args) {
		return {
			components: {
				explore_,
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
			template: '<explore_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof explore_>;
export default meta;
