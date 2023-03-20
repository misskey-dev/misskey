import { Meta, Story } from '@storybook/vue3';
import MkAsUi from './MkAsUi.vue';
const meta = {
	title: 'components/MkAsUi',
	component: MkAsUi,
};
export const Default = {
	components: {
		MkAsUi,
	},
	template: '<MkAsUi />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
