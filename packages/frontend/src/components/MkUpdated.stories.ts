import { Meta, Story } from '@storybook/vue3';
import MkUpdated from './MkUpdated.vue';
const meta = {
	title: 'components/MkUpdated',
	component: MkUpdated,
};
export const Default = {
	components: {
		MkUpdated,
	},
	template: '<MkUpdated />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
