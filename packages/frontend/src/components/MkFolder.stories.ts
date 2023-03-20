import { Meta, Story } from '@storybook/vue3';
import MkFolder from './MkFolder.vue';
const meta = {
	title: 'components/MkFolder',
	component: MkFolder,
};
export const Default = {
	components: {
		MkFolder,
	},
	template: '<MkFolder />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
