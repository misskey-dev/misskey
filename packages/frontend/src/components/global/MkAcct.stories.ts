import { Meta, Story } from '@storybook/vue3';
import MkAcct from './MkAcct.vue';
const meta = {
	title: 'components/global/MkAcct',
	component: MkAcct,
};
export const Default = {
	components: {
		MkAcct,
	},
	template: '<MkAcct />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
