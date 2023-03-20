import { Meta, Story } from '@storybook/vue3';
import role from './role.vue';
const meta = {
	title: 'pages/role',
	component: role,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				role,
			},
			props: Object.keys(argTypes),
			template: '<role v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
