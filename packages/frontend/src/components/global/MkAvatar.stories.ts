import { Meta, Story } from '@storybook/vue3';
import MkAvatar from './MkAvatar.vue';
const meta = {
	title: 'components/global/MkAvatar',
	component: MkAvatar,
};
export const Default = {
	components: {
		MkAvatar,
	},
	template: '<MkAvatar />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
