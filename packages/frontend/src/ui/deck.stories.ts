/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import deck_ from './deck.vue';
const meta = {
	title: 'ui/deck',
	component: deck_,
} satisfies Meta<typeof deck_>;
export const Default = {
	render(args) {
		return {
			components: {
				deck_,
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
			template: '<deck_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof deck_>;
export default meta;
