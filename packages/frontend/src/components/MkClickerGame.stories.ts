import { Meta, Story } from '@storybook/vue3';
import MkClickerGame from './MkClickerGame.vue';
const meta = {
	title: 'components/MkClickerGame',
	component: MkClickerGame,
};
export const Default = {
	components: {
		MkClickerGame,
	},
	template: '<MkClickerGame />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
