import { Meta, Story } from '@storybook/vue3';
import upload from './upload.vue';
const meta = {
	title: 'ui/_common_/upload',
	component: upload,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				upload,
			},
			props: Object.keys(argTypes),
			template: '<upload v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
