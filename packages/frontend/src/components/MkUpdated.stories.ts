/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkUpdated from './MkUpdated.vue';
const meta = {
	title: 'components/MkUpdated',
	component: MkUpdated,
} satisfies Meta<typeof MkUpdated>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkUpdated,
			},
			props: Object.keys(argTypes),
			template: '<MkUpdated v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkUpdated>;
export default meta;
