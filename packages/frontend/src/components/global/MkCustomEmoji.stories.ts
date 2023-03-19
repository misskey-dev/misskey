import { Meta, Story } from '@storybook/vue3';
import MkCustomEmoji from './MkCustomEmoji.vue';
const meta = {
	title: 'components/global/MkCustomEmoji',
	component: MkCustomEmoji,
};
export const Default = {
	components: {
		MkCustomEmoji,
	},
	template: '<MkCustomEmoji />',
};
export default meta;
