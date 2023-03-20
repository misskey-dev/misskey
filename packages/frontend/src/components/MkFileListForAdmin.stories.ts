import { Meta, Story } from '@storybook/vue3';
import MkFileListForAdmin from './MkFileListForAdmin.vue';
const meta = {
	title: 'components/MkFileListForAdmin',
	component: MkFileListForAdmin,
};
export const Default = {
	components: {
		MkFileListForAdmin,
	},
	template: '<MkFileListForAdmin />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
