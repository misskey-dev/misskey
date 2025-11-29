/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { comment } from '@/server/web/views/_.js';
import type { CommonProps } from '@/server/web/views/_.js';
import type { PropsWithChildren, Children } from '@kitajs/html';

export function LayoutEmbed(props: PropsWithChildren<CommonProps<{
	title?: string;
	noindex?: boolean;
	desc?: string;
	img?: string;
	serverErrorImageUrl?: string;
	infoImageUrl?: string;
	notFoundImageUrl?: string;
	metaJson?: string;
	embedCtxJson?: string;

	titleSlot?: Children;
	metaSlot?: Children;
}>>) {
	const now = Date.now();

	// 変数名をsafeで始めることでエラーをスキップ
	const safeMetaJson = props.metaJson;
	const safeEmbedCtxJson = props.embedCtxJson;

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

					{!props.config.frontendEmbedManifestExists ? <script type="module" src="/embed_vite/@vite/client"></script> : null}

					{props.titleSlot ?? <title safe>{props.title ?? 'Misskey'}</title>}

					{props.metaSlot}

					<meta name="robots" content="noindex" />

					<link rel="stylesheet" href="/embed_vite/loader/style.css" />

					<script>
						const VERSION = '{props.version}';
						const CLIENT_ENTRY = {JSON.stringify(props.config.frontendEmbedEntry.file)};
					</script>

					{props.metaJson != null ? <script type="application/json" id="misskey_meta" data-generated-at={now}>{safeMetaJson}</script> : null}
					{props.embedCtxJson != null ? <script type="application/json" id="misskey_embedCtx" data-generated-at={now}>{safeEmbedCtxJson}</script> : null}

					<script src="/embed_vite/loader/boot.js"></script>
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

