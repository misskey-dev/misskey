import { Meta, Story } from '@storybook/vue3';
import roles from './roles.vue';
const meta = {
	title: 'pages/admin/roles',
	component: roles,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				roles,
			},
			props: Object.keys(argTypes),
			template: '<roles v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
