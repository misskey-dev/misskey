/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import explore_featured from './explore.featured.vue';
const meta = {
	title: 'pages/explore.featured',
	component: explore_featured,
} satisfies Meta<typeof explore_featured>;
export const Default = {
	render(args) {
		return {
			components: {
				explore_featured,
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
			template: '<explore_featured v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof explore_featured>;
export default meta;
