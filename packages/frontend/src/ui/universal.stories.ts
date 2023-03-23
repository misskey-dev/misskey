/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import universal_ from './universal.vue';
const meta = {
	title: 'ui/universal',
	component: universal_,
} satisfies Meta<typeof universal_>;
export const Default = {
	render(args) {
		return {
			components: {
				universal_,
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
			template: '<universal_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof universal_>;
export default meta;
