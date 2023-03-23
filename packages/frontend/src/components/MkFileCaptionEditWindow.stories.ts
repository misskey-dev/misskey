/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkFileCaptionEditWindow from './MkFileCaptionEditWindow.vue';
const meta = {
	title: 'components/MkFileCaptionEditWindow',
	component: MkFileCaptionEditWindow,
} satisfies Meta<typeof MkFileCaptionEditWindow>;
export const Default = {
	render(args) {
		return {
			components: {
				MkFileCaptionEditWindow,
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
			template: '<MkFileCaptionEditWindow v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkFileCaptionEditWindow>;
export default meta;
