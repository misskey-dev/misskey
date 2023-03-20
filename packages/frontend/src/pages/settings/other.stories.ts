import { Meta, Story } from '@storybook/vue3';
import other from './other.vue';
const meta = {
	title: 'pages/settings/other',
	component: other,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				other,
			},
			props: Object.keys(argTypes),
			template: '<other v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
