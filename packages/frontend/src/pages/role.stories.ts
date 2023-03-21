/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import role_ from './role.vue';
const meta = {
	title: 'pages/role',
	component: role_,
} satisfies Meta<typeof role_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				role_,
			},
			props: Object.keys(argTypes),
			template: '<role_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof role_>;
export default meta;
