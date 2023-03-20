import { Meta, Story } from '@storybook/vue3';
import MkRolePreview from './MkRolePreview.vue';
const meta = {
	title: 'components/MkRolePreview',
	component: MkRolePreview,
};
export const Default = {
	components: {
		MkRolePreview,
	},
	template: '<MkRolePreview />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
