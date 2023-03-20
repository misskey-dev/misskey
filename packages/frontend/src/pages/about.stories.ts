import { Meta, Story } from '@storybook/vue3';
import about from './about.vue';
const meta = {
	title: 'pages/about',
	component: about,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				about,
			},
			props: Object.keys(argTypes),
			template: '<about v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
