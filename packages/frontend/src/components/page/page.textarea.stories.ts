import { Meta, Story } from '@storybook/vue3';
import page_textarea from './page.textarea.vue';
const meta = {
	title: 'components/page/page.textarea',
	component: page_textarea,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				page_textarea,
			},
			props: Object.keys(argTypes),
			template: '<page_textarea v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
