import { Meta, Story } from '@storybook/vue3';
import MkTab from './MkTab.vue';
const meta = {
	title: 'components/MkTab',
	component: MkTab,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkTab,
			},
			props: Object.keys(argTypes),
			template: '<MkTab v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
