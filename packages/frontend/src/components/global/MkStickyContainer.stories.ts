import { Meta, Story } from '@storybook/vue3';
import MkStickyContainer from './MkStickyContainer.vue';
const meta = {
	title: 'components/global/MkStickyContainer',
	component: MkStickyContainer,
};
export const Default = {
	components: {
		MkStickyContainer,
	},
	template: '<MkStickyContainer />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
