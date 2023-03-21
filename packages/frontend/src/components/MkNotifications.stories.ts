/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkNotifications from './MkNotifications.vue';
const meta = {
	title: 'components/MkNotifications',
	component: MkNotifications,
} satisfies Meta<typeof MkNotifications>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkNotifications,
			},
			props: Object.keys(argTypes),
			template: '<MkNotifications v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkNotifications>;
export default meta;
