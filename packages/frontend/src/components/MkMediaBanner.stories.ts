/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkMediaBanner from './MkMediaBanner.vue';
const meta = {
	title: 'components/MkMediaBanner',
	component: MkMediaBanner,
} satisfies Meta<typeof MkMediaBanner>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkMediaBanner,
			},
			props: Object.keys(argTypes),
			template: '<MkMediaBanner v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkMediaBanner>;
export default meta;
