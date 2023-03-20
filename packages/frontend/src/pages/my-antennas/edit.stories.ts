import { Meta, Story } from '@storybook/vue3';
import edit from './edit.vue';
const meta = {
	title: 'pages/my-antennas/edit',
	component: edit,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				edit,
			},
			props: Object.keys(argTypes),
			template: '<edit v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
