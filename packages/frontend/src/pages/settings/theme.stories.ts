/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import theme_ from './theme.vue';
const meta = {
	title: 'pages/settings/theme',
	component: theme_,
} satisfies Meta<typeof theme_>;
export const Default = {
	render(args) {
		return {
			components: {
				theme_,
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
			template: '<theme_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof theme_>;
export default meta;
