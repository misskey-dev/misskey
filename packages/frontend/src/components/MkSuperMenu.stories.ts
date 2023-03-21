/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkSuperMenu from './MkSuperMenu.vue';
const meta = {
	title: 'components/MkSuperMenu',
	component: MkSuperMenu,
} satisfies Meta<typeof MkSuperMenu>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkSuperMenu,
			},
			props: Object.keys(argTypes),
			template: '<MkSuperMenu v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkSuperMenu>;
export default meta;
