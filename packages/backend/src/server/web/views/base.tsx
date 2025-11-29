/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { comment, defaultDescription } from '@/server/web/views/_.js';
import type { CommonProps } from '@/server/web/views/_.js';
import type { PropsWithChildren, Children } from '@kitajs/html';

export function Layout(props: PropsWithChildren<CommonProps<{
	title?: string;
	noindex?: boolean;
	desc?: string;
	img?: string;
	serverErrorImageUrl?: string;
	infoImageUrl?: string;
	notFoundImageUrl?: string;
	metaJson?: string;
	clientCtxJson?: string;

	titleSlot?: Children;
	descSlot?: Children;
	metaSlot?: Children;
	ogSlot?: Children;
}>>) {
	const now = Date.now();

	// 変数名をsafeで始めることでエラーをスキップ
	const safeMetaJson = props.metaJson;
	const safeClientCtxJson = props.clientCtxJson;

	return (
		<>
			{'<!DOCTYPE html>'}
			{comment}
			<html>
				<head>
					<meta charset="UTF-8" />
					<meta name="application-name" content="Misskey" />
					<meta name="refferer" content="origin" />
					<meta name="theme-color" content={props.themeColor ?? '#86b300'} />
					<meta name="theme-color-orig" content={props.themeColor ?? '#86b300'} />
					<meta name="viewport" content="width=device-width, initial-scale=1.0" />
					<meta property="og:site_name" content={props.instanceName ?? 'Misskey'} />
					<meta property="instance_url" content={props.instanceUrl} />
					<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
					<meta name="format-detection" content="telephone=no,date=no,address=no,email=no,url=no" />
					<link rel="icon" href={props.icon ?? '/favicon.ico'} />
					<link rel="apple-touch-icon" href={props.appleTouchIcon ?? '/apple-touch-icon.png'} />
					<link rel="manifest" href="/manifest.json" />
					<link rel="search" type="application/opensearchdescription+xml" title={props.title ?? 'Misskey'} href={`${props.config.url}/opensearch.xml`} />
					{props.serverErrorImageUrl != null ? <link rel="prefetch" as="image" href={props.serverErrorImageUrl} /> : null}
					{props.infoImageUrl != null ? <link rel="prefetch" as="image" href={props.infoImageUrl} /> : null}
					{props.notFoundImageUrl != null ? <link rel="prefetch" as="image" href={props.notFoundImageUrl} /> : null}

					{!props.config.frontendManifestExists ? <script type="module" src="/vite/@vite/client"></script> : null}

					{props.titleSlot ?? <title safe>{props.title ?? 'Misskey'}</title>}

					{props.noindex ? <meta name="robots" content="noindex" /> : null}

					{props.descSlot ?? (props.desc != null ? <meta name="description" content={props.desc ?? defaultDescription} /> : null)}

					{props.metaSlot}

					{props.ogSlot ?? (
						<>
							{props.title != null ? <meta property="og:title" content={props.title ?? 'Misskey'} /> : null}
							{props.desc != null ? <meta property="og:description" content={props.desc ?? defaultDescription} /> : null}
							{props.img != null ? <meta property="og:image" content={props.img} /> : null}
							<meta property="twitter:card" content="summary" />
						</>
					)}

					<link rel="stylesheet" href="/vite/loader/style.css" />

					<script>
						const VERSION = '{props.version}';
						const CLIENT_ENTRY = {JSON.stringify(props.config.frontendEntry.file)};
					</script>

					{props.metaJson != null ? <script type="application/json" id="misskey_meta" data-generated-at={now}>{safeMetaJson}</script> : null}
					{props.clientCtxJson != null ? <script type="application/json" id="misskey_clientCtx" data-generated-at={now}>{safeClientCtxJson}</script> : null}

					<script src="/vite/loader/boot.js"></script>
				</head>
				<body>
					<noscript>
						<p>
							JavaScriptを有効にしてください<br />
							Please turn on your JavaScript
						</p>
					</noscript>
					<div id="splash">
						<img id="splashIcon" src={props.icon ?? '/static-assets/splash.png'} />
						<div id="splashSpinner">
							<svg class="spinner bg" viewBox="0 0 152 152" xmlns="http://www.w3.org/2000/svg">
								<g transform="matrix(1,0,0,1,12,12)">
									<circle cx="64" cy="64" r="64" style="fill:none;stroke:currentColor;stroke-width:24px;"/>
								</g>
							</svg>
							<svg class="spinner fg" viewBox="0 0 152 152" xmlns="http://www.w3.org/2000/svg">
								<g transform="matrix(1,0,0,1,12,12)">
									<path d="M128,64C128,28.654 99.346,0 64,0C99.346,0 128,28.654 128,64Z" style="fill:none;stroke:currentColor;stroke-width:24px;"/>
								</g>
							</svg>
						</div>
					</div>
					{props.children}
				</body>
			</html>
		</>
	);
}

export { Layout as BasePage };

