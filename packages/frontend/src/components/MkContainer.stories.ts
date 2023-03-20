import { Meta, Story } from '@storybook/vue3';
import MkContainer from './MkContainer.vue';
const meta = {
	title: 'components/MkContainer',
	component: MkContainer,
};
export const Default = {
	components: {
		MkContainer,
	},
	template: '<MkContainer />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
