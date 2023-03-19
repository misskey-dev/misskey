import { Meta, Story } from '@storybook/vue3';
import suspense from './suspense.vue';
const meta = {
	title: 'components/form/suspense',
	component: suspense,
};
export const Default = {
	components: {
		suspense,
	},
	template: '<suspense />',
};
export default meta;
