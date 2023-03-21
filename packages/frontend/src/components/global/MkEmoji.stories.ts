/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkEmoji from './MkEmoji.vue';
const meta = {
	title: 'components/global/MkEmoji',
	component: MkEmoji,
} satisfies Meta<typeof MkEmoji>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkEmoji,
			},
			props: Object.keys(argTypes),
			template: '<MkEmoji v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkEmoji>;
export default meta;
