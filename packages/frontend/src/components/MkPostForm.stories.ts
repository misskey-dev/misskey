import { Meta, Story } from '@storybook/vue3';
import MkPostForm from './MkPostForm.vue';
const meta = {
	title: 'components/MkPostForm',
	component: MkPostForm,
};
export const Default = {
	components: {
		MkPostForm,
	},
	template: '<MkPostForm />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
