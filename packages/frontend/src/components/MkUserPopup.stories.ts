import { Meta, Story } from '@storybook/vue3';
import MkUserPopup from './MkUserPopup.vue';
const meta = {
	title: 'components/MkUserPopup',
	component: MkUserPopup,
};
export const Default = {
	components: {
		MkUserPopup,
	},
	template: '<MkUserPopup />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
