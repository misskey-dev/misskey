/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkMediaList from './MkMediaList.vue';
const meta = {
	title: 'components/MkMediaList',
	component: MkMediaList,
} satisfies Meta<typeof MkMediaList>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkMediaList,
			},
			props: Object.keys(argTypes),
			template: '<MkMediaList v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkMediaList>;
export default meta;
