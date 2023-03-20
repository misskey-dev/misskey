import { Meta, Story } from '@storybook/vue3';
import MkRemoteCaution from './MkRemoteCaution.vue';
const meta = {
	title: 'components/MkRemoteCaution',
	component: MkRemoteCaution,
};
export const Default = {
	components: {
		MkRemoteCaution,
	},
	template: '<MkRemoteCaution />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
