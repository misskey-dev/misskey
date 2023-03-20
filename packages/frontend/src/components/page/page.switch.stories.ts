import { Meta, Story } from '@storybook/vue3';
import page_switch from './page.switch.vue';
const meta = {
	title: 'components/page/page.switch',
	component: page_switch,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				page_switch,
			},
			props: Object.keys(argTypes),
			template: '<page_switch v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
