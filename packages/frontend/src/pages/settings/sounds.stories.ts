import { Meta, Story } from '@storybook/vue3';
import sounds from './sounds.vue';
const meta = {
	title: 'pages/settings/sounds',
	component: sounds,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				sounds,
			},
			props: Object.keys(argTypes),
			template: '<sounds v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
