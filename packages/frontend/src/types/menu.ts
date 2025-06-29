/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import type { Component, ComputedRef, Ref } from 'vue';
import type { ComponentProps as CP } from 'vue-component-type-helpers';

type ComponentProps<T extends Component> = { [K in keyof CP<T>]: CP<T>[K] | Ref<CP<T>[K]> };

type MenuRadioOptionsDef = Record<string, any>;

type Text = string | ComputedRef<string>;

export type MenuAction = (ev: MouseEvent) => void;

export type MenuDivider = { type: 'divider' };
export type MenuNull = undefined;
export type MenuLabel = { type: 'label', text: Text, caption?: Text };
export type MenuLink = { type: 'link', to: string, text: Text, caption?: Text, icon?: string, indicate?: boolean, avatar?: Misskey.entities.User };
export type MenuA = { type: 'a', href: string, target?: string, download?: string, text: Text, caption?: Text, icon?: string, indicate?: boolean };
export type MenuUser = { type: 'user', user: Misskey.entities.User, active?: boolean, indicate?: boolean, action: MenuAction };
export type MenuSwitch = { type: 'switch', ref: Ref<boolean>, text: Text, caption?: Text, icon?: string, disabled?: boolean | Ref<boolean> };
export type MenuButton = { type?: 'button', text: Text, caption?: Text, icon?: string, indicate?: boolean, danger?: boolean, active?: boolean | ComputedRef<boolean>, avatar?: Misskey.entities.User; action: MenuAction };
export type MenuRadio = { type: 'radio', text: Text, caption?: Text, icon?: string, ref: Ref<MenuRadioOptionsDef[keyof MenuRadioOptionsDef]>, options: MenuRadioOptionsDef, disabled?: boolean | Ref<boolean> };
export type MenuRadioOption = { type: 'radioOption', text: Text, caption?: Text, action: MenuAction; active?: boolean | ComputedRef<boolean> };
export type MenuComponent<T extends Component = any> = { type: 'component', component: T, props?: ComponentProps<T> };
export type MenuParent = { type: 'parent', text: Text, caption?: Text, icon?: string, children: MenuItem[] | (() => Promise<MenuItem[]> | MenuItem[]) };

export type MenuPending = { type: 'pending' };

type OuterMenuItem = MenuDivider | MenuNull | MenuLabel | MenuLink | MenuA | MenuUser | MenuSwitch | MenuButton | MenuRadio | MenuRadioOption | MenuComponent | MenuParent;
type OuterPromiseMenuItem = Promise<MenuLabel | MenuLink | MenuA | MenuUser | MenuSwitch | MenuButton | MenuComponent | MenuParent>;
export type MenuItem = OuterMenuItem | OuterPromiseMenuItem;
export type InnerMenuItem = MenuDivider | MenuPending | MenuLabel | MenuLink | MenuA | MenuUser | MenuSwitch | MenuButton | MenuRadio | MenuRadioOption | MenuComponent | MenuParent;
