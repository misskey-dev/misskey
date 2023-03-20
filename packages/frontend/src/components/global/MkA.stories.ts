import { Meta, Story } from '@storybook/vue3';
import MkA from './MkA.vue';
const meta = {
	title: 'components/global/MkA',
	component: MkA,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkA,
			},
			props: Object.keys(argTypes),
			template: '<MkA v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
