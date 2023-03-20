import { Meta, Story } from '@storybook/vue3';
import drive from './drive.vue';
const meta = {
	title: 'pages/settings/drive',
	component: drive,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				drive,
			},
			props: Object.keys(argTypes),
			template: '<drive v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
