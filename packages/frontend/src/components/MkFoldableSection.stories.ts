import { Meta, Story } from '@storybook/vue3';
import MkFoldableSection from './MkFoldableSection.vue';
const meta = {
	title: 'components/MkFoldableSection',
	component: MkFoldableSection,
};
export const Default = {
	components: {
		MkFoldableSection,
	},
	template: '<MkFoldableSection />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
