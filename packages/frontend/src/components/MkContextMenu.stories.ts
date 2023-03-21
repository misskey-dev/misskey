/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkContextMenu from './MkContextMenu.vue';
const meta = {
	title: 'components/MkContextMenu',
	component: MkContextMenu,
} satisfies Meta<typeof MkContextMenu>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkContextMenu,
			},
			props: Object.keys(argTypes),
			template: '<MkContextMenu v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkContextMenu>;
export default meta;
