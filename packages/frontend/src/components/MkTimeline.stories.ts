/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkTimeline from './MkTimeline.vue';
const meta = {
	title: 'components/MkTimeline',
	component: MkTimeline,
} satisfies Meta<typeof MkTimeline>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkTimeline,
			},
			props: Object.keys(argTypes),
			template: '<MkTimeline v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkTimeline>;
export default meta;
