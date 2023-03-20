import { Meta, Story } from '@storybook/vue3';
import MkNoteSub from './MkNoteSub.vue';
const meta = {
	title: 'components/MkNoteSub',
	component: MkNoteSub,
};
export const Default = {
	components: {
		MkNoteSub,
	},
	template: '<MkNoteSub />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
