/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkOmit from './MkOmit.vue';
const meta = {
	title: 'components/MkOmit',
	component: MkOmit,
} satisfies Meta<typeof MkOmit>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkOmit,
			},
			props: Object.keys(argTypes),
			template: '<MkOmit v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkOmit>;
export default meta;
