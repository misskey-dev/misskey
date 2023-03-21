/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import link_ from './link.vue';
const meta = {
	title: 'components/form/link',
	component: link_,
} satisfies Meta<typeof link_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				link_,
			},
			props: Object.keys(argTypes),
			template: '<link_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof link_>;
export default meta;
