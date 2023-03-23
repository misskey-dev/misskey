/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import custom_css from './custom-css.vue';
const meta = {
	title: 'pages/settings/custom-css',
	component: custom_css,
} satisfies Meta<typeof custom_css>;
export const Default = {
	render(args) {
		return {
			components: {
				custom_css,
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
			template: '<custom_css v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof custom_css>;
export default meta;
