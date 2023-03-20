import { Meta, Story } from '@storybook/vue3';
import MkUserOnlineIndicator from './MkUserOnlineIndicator.vue';
const meta = {
	title: 'components/MkUserOnlineIndicator',
	component: MkUserOnlineIndicator,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkUserOnlineIndicator,
			},
			props: Object.keys(argTypes),
			template: '<MkUserOnlineIndicator v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
