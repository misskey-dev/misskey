/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import classic_ from './classic.vue';
const meta = {
	title: 'ui/classic',
	component: classic_,
} satisfies Meta<typeof classic_>;
export const Default = {
	render(args) {
		return {
			components: {
				classic_,
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
			template: '<classic_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof classic_>;
export default meta;
