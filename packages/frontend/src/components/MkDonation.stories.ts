import { Meta, Story } from '@storybook/vue3';
import MkDonation from './MkDonation.vue';
const meta = {
	title: 'components/MkDonation',
	component: MkDonation,
};
export const Default = {
	components: {
		MkDonation,
	},
	template: '<MkDonation />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
