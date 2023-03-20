import { Meta, Story } from '@storybook/vue3';
import classic_header from './classic.header.vue';
const meta = {
	title: 'ui/classic.header',
	component: classic_header,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				classic_header,
			},
			props: Object.keys(argTypes),
			template: '<classic_header v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
