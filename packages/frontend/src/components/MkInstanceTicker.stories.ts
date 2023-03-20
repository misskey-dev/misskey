import { Meta, Story } from '@storybook/vue3';
import MkInstanceTicker from './MkInstanceTicker.vue';
const meta = {
	title: 'components/MkInstanceTicker',
	component: MkInstanceTicker,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkInstanceTicker,
			},
			props: Object.keys(argTypes),
			template: '<MkInstanceTicker v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
