import { Meta, Story } from '@storybook/vue3';
import explore_roles from './explore.roles.vue';
const meta = {
	title: 'pages/explore.roles',
	component: explore_roles,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				explore_roles,
			},
			props: Object.keys(argTypes),
			template: '<explore_roles v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
