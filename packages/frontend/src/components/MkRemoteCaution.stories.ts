import { Meta, Story } from '@storybook/vue3';
import MkRemoteCaution from './MkRemoteCaution.vue';
const meta = {
	title: 'components/MkRemoteCaution',
	component: MkRemoteCaution,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkRemoteCaution,
			},
			props: Object.keys(argTypes),
			template: '<MkRemoteCaution v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
