import { Meta, Story } from '@storybook/vue3';
import MkFoldableSection from './MkFoldableSection.vue';
const meta = {
	title: 'components/MkFoldableSection',
	component: MkFoldableSection,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkFoldableSection,
			},
			props: Object.keys(argTypes),
			template: '<MkFoldableSection v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
