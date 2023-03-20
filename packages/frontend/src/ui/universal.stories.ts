import { Meta, Story } from '@storybook/vue3';
import universal from './universal.vue';
const meta = {
	title: 'ui/universal',
	component: universal,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				universal,
			},
			props: Object.keys(argTypes),
			template: '<universal v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
