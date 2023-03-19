import { Meta, Story } from '@storybook/vue3';
import MkToast from './MkToast.vue';
const meta = {
	title: 'components/MkToast',
	component: MkToast,
};
export const Default = {
	components: {
		MkToast,
	},
	template: '<MkToast />',
};
export default meta;
