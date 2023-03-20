import { Meta, Story } from '@storybook/vue3';
import MkDonation from './MkDonation.vue';
const meta = {
	title: 'components/MkDonation',
	component: MkDonation,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkDonation,
			},
			props: Object.keys(argTypes),
			template: '<MkDonation v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
