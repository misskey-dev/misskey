import { Meta, StoryObj } from '@storybook/vue3';
import MkNotification from './MkNotification.vue';
const meta = {
	title: 'components/MkNotification',
	component: MkNotification,
} satisfies Meta<typeof MkNotification>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkNotification,
			},
			props: Object.keys(argTypes),
			template: '<MkNotification v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkNotification>;
export default meta;
