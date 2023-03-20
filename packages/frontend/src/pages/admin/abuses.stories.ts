import { Meta, Story } from '@storybook/vue3';
import abuses from './abuses.vue';
const meta = {
	title: 'pages/admin/abuses',
	component: abuses,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				abuses,
			},
			props: Object.keys(argTypes),
			template: '<abuses v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
