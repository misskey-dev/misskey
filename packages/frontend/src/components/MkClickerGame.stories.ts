/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkClickerGame from './MkClickerGame.vue';
const meta = {
	title: 'components/MkClickerGame',
	component: MkClickerGame,
} satisfies Meta<typeof MkClickerGame>;
export const Default = {
	render(args) {
		return {
			components: {
				MkClickerGame,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...args,
					};
				},
			},
			template: '<MkClickerGame v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkClickerGame>;
export default meta;
