import { Meta, Story } from '@storybook/vue3';
import MkPostForm from './MkPostForm.vue';
const meta = {
	title: 'components/MkPostForm',
	component: MkPostForm,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkPostForm,
			},
			props: Object.keys(argTypes),
			template: '<MkPostForm v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
