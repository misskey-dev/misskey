/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkCustomEmoji from './MkCustomEmoji.vue';
const meta = {
	title: 'components/global/MkCustomEmoji',
	component: MkCustomEmoji,
} satisfies Meta<typeof MkCustomEmoji>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkCustomEmoji,
			},
			props: Object.keys(argTypes),
			template: '<MkCustomEmoji v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkCustomEmoji>;
export default meta;
