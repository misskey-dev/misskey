import { Meta, Story } from '@storybook/vue3';
import classic_sidebar from './classic.sidebar.vue';
const meta = {
	title: 'ui/classic.sidebar',
	component: classic_sidebar,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				classic_sidebar,
			},
			props: Object.keys(argTypes),
			template: '<classic_sidebar v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
