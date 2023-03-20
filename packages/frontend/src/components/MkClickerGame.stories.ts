import { Meta, StoryObj } from '@storybook/vue3';
import MkClickerGame from './MkClickerGame.vue';
const meta = {
	title: 'components/MkClickerGame',
	component: MkClickerGame,
} satisfies Meta<typeof MkClickerGame>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkClickerGame,
			},
			props: Object.keys(argTypes),
			template: '<MkClickerGame v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkClickerGame>;
export default meta;
