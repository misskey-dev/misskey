import { Meta, Story } from '@storybook/vue3';
import MkGoogle from './MkGoogle.vue';
const meta = {
	title: 'components/MkGoogle',
	component: MkGoogle,
};
export const Default = {
	components: {
		MkGoogle,
	},
	template: '<MkGoogle />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
