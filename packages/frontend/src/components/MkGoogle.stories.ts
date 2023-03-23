/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkGoogle from './MkGoogle.vue';
const meta = {
	title: 'components/MkGoogle',
	component: MkGoogle,
} satisfies Meta<typeof MkGoogle>;
export const Default = {
	render(args) {
		return {
			components: {
				MkGoogle,
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
			template: '<MkGoogle v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkGoogle>;
export default meta;
