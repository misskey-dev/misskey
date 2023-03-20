import { Meta, Story } from '@storybook/vue3';
import create from './create.vue';
const meta = {
	title: 'pages/my-antennas/create',
	component: create,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				create,
			},
			props: Object.keys(argTypes),
			template: '<create v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
