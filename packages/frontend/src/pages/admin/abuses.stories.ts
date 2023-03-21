/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import abuses_ from './abuses.vue';
const meta = {
	title: 'pages/admin/abuses',
	component: abuses_,
} satisfies Meta<typeof abuses_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				abuses_,
			},
			props: Object.keys(argTypes),
			template: '<abuses_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof abuses_>;
export default meta;
