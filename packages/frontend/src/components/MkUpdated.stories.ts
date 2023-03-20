import { Meta, Story } from '@storybook/vue3';
import MkUpdated from './MkUpdated.vue';
const meta = {
	title: 'components/MkUpdated',
	component: MkUpdated,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkUpdated,
			},
			props: Object.keys(argTypes),
			template: '<MkUpdated v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
