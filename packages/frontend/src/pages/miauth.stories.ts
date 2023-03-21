/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import miauth_ from './miauth.vue';
const meta = {
	title: 'pages/miauth',
	component: miauth_,
} satisfies Meta<typeof miauth_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				miauth_,
			},
			props: Object.keys(argTypes),
			template: '<miauth_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof miauth_>;
export default meta;
