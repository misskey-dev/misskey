/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkTextarea from './MkTextarea.vue';
const meta = {
	title: 'components/MkTextarea',
	component: MkTextarea,
} satisfies Meta<typeof MkTextarea>;
export const Default = {
	render(args) {
		return {
			components: {
				MkTextarea,
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
			template: '<MkTextarea v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkTextarea>;
export default meta;
