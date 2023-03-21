/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import other_settings from './other-settings.vue';
const meta = {
	title: 'pages/admin/other-settings',
	component: other_settings,
} satisfies Meta<typeof other_settings>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				other_settings,
			},
			props: Object.keys(argTypes),
			template: '<other_settings v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof other_settings>;
export default meta;
