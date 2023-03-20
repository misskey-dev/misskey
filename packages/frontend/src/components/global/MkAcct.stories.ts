import { Meta, Story } from '@storybook/vue3';
import MkAcct from './MkAcct.vue';
const meta = {
	title: 'components/global/MkAcct',
	component: MkAcct,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkAcct,
			},
			props: Object.keys(argTypes),
			template: '<MkAcct v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
