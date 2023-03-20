import { Meta, Story } from '@storybook/vue3';
import MkNotifications from './MkNotifications.vue';
const meta = {
	title: 'components/MkNotifications',
	component: MkNotifications,
};
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
};
export default meta;
