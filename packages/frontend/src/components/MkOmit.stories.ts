import { Meta, Story } from '@storybook/vue3';
import MkOmit from './MkOmit.vue';
const meta = {
	title: 'components/MkOmit',
	component: MkOmit,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkOmit,
			},
			props: Object.keys(argTypes),
			template: '<MkOmit v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
