#!/bin/bash

# SPDX-FileCopyrightText: syuilo and misskey-project
# SPDX-License-Identifier: AGPL-3.0-only

PORT=$(grep '^port:' /misskey/.config/default.yml | awk 'NR==1{print $2; exit}')
curl -Sfso/dev/null "http://localhost:${PORT}/healthz"
