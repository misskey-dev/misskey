/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import mute_block from './mute-block.vue';
const meta = {
	title: 'pages/settings/mute-block',
	component: mute_block,
} satisfies Meta<typeof mute_block>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				mute_block,
			},
			props: Object.keys(argTypes),
			template: '<mute_block v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof mute_block>;
export default meta;
