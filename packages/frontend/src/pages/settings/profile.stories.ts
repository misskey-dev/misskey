import { Meta, Story } from '@storybook/vue3';
import profile from './profile.vue';
const meta = {
	title: 'pages/settings/profile',
	component: profile,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				profile,
			},
			props: Object.keys(argTypes),
			template: '<profile v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
