/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkMenu from './MkMenu.vue';
const meta = {
	title: 'components/MkMenu',
	component: MkMenu,
} satisfies Meta<typeof MkMenu>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkMenu,
			},
			props: Object.keys(argTypes),
			template: '<MkMenu v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkMenu>;
export default meta;
