/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkTab from './MkTab.vue';
const meta = {
	title: 'components/MkTab',
	component: MkTab,
} satisfies Meta<typeof MkTab>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkTab,
			},
			props: Object.keys(argTypes),
			template: '<MkTab v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkTab>;
export default meta;
