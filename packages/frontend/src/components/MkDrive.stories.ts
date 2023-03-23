/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkDrive from './MkDrive.vue';
const meta = {
	title: 'components/MkDrive',
	component: MkDrive,
} satisfies Meta<typeof MkDrive>;
export const Default = {
	render(args) {
		return {
			components: {
				MkDrive,
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
			template: '<MkDrive v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkDrive>;
export default meta;
