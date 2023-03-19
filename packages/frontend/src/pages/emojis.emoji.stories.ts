import { Meta, Story } from '@storybook/vue3';
import emojis_emoji from './emojis.emoji.vue';
const meta = {
	title: 'pages/emojis.emoji',
	component: emojis_emoji,
};
export const Default = {
	components: {
		emojis_emoji,
	},
	template: '<emojis.emoji />',
};
export default meta;
