/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkDateSeparatedList from './MkDateSeparatedList.vue';
const meta = {
	title: 'components/MkDateSeparatedList',
	component: MkDateSeparatedList,
} satisfies Meta<typeof MkDateSeparatedList>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkDateSeparatedList,
			},
			props: Object.keys(argTypes),
			template: '<MkDateSeparatedList v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkDateSeparatedList>;
export default meta;
