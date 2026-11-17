# ActivityPub

ActivityPub のペイロードを変更する人向け。

[Contribution guide](../../CONTRIBUTING.md)

## Additional things for ActivityPub payload changes
*This section is specific to misskey-dev implementation. Other fork or implementation may take different way. A significant difference is that non-"misskey-dev" extension is not described in the misskey-hub's document.*

If PR includes changes to ActivityPub payload, please reflect it in [misskey-hub's document](https://github.com/misskey-dev/misskey-hub-next/blob/master/content/ns.md) by sending PR.

The name of purporsed extension property (referred as "extended property" in later) to ActivityPub shall be prefixed by `_misskey_`. (i.e. `_misskey_quote`)

The extended property in `packages/backend/src/core/activitypub/type.ts` **must** be declared as optional because ActivityPub payloads that comes from older Misskey or other implementation may not contain it.

The extended property must be included in the context definition. Context is defined in `packages/backend/src/core/activitypub/misc/contexts.ts`.
The key shall be same as the name of extended property, and the value shall be same as "short IRI".

"Short IRI" is defined in misskey-hub's document, but usually takes form of `misskey:<name of extended property>`. (i.e. `misskey:_misskey_quote`)

One should not add property that has defined before by other implementation, or add custom variant value to "well-known" property.
