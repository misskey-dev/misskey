import { Meta, Story } from '@storybook/vue3';
import MkLink from './MkLink.vue';
const meta = {
	title: 'components/MkLink',
	component: MkLink,
};
export const Default = {
	components: {
		MkLink,
	},
	template: '<MkLink />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
