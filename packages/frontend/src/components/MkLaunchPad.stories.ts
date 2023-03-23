/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkLaunchPad from './MkLaunchPad.vue';
const meta = {
	title: 'components/MkLaunchPad',
	component: MkLaunchPad,
} satisfies Meta<typeof MkLaunchPad>;
export const Default = {
	render(args) {
		return {
			components: {
				MkLaunchPad,
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
			template: '<MkLaunchPad v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkLaunchPad>;
export default meta;
