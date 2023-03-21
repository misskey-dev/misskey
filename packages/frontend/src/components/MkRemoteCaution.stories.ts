/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkRemoteCaution from './MkRemoteCaution.vue';
const meta = {
	title: 'components/MkRemoteCaution',
	component: MkRemoteCaution,
} satisfies Meta<typeof MkRemoteCaution>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkRemoteCaution,
			},
			props: Object.keys(argTypes),
			template: '<MkRemoteCaution v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkRemoteCaution>;
export default meta;
