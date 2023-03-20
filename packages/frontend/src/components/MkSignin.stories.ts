import { Meta, Story } from '@storybook/vue3';
import MkSignin from './MkSignin.vue';
const meta = {
	title: 'components/MkSignin',
	component: MkSignin,
};
export const Default = {
	components: {
		MkSignin,
	},
	template: '<MkSignin />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
