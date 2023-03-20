import { Meta, Story } from '@storybook/vue3';
import MkEmoji from './MkEmoji.vue';
const meta = {
	title: 'components/global/MkEmoji',
	component: MkEmoji,
};
export const Default = {
	components: {
		MkEmoji,
	},
	template: '<MkEmoji />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
