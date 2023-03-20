import { Meta, Story } from '@storybook/vue3';
import MkModal from './MkModal.vue';
const meta = {
	title: 'components/MkModal',
	component: MkModal,
};
export const Default = {
	components: {
		MkModal,
	},
	template: '<MkModal />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
