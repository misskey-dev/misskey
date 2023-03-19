import { Meta, Story } from '@storybook/vue3';
import clips from './clips.vue';
const meta = {
	title: 'pages/user/clips',
	component: clips,
};
export const Default = {
	components: {
		clips,
	},
	template: '<clips />',
};
export default meta;
