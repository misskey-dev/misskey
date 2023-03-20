import { Meta, Story } from '@storybook/vue3';
import editor from './editor.vue';
const meta = {
	title: 'pages/my-antennas/editor',
	component: editor,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				editor,
			},
			props: Object.keys(argTypes),
			template: '<editor v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
