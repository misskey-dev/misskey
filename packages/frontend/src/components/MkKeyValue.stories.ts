import { Meta, Story } from '@storybook/vue3';
import MkKeyValue from './MkKeyValue.vue';
const meta = {
	title: 'components/MkKeyValue',
	component: MkKeyValue,
};
export const Default = {
	components: {
		MkKeyValue,
	},
	template: '<MkKeyValue />',
};
export default meta;
