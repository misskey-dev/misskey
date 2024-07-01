#!/bin/bash

# SPDX-FileCopyrightText: syuilo and misskey-project , Type4ny-project
# SPDX-License-Identifier: AGPL-3.0-only

PORT=$(grep '^port:' /type4ny/.config/default.yml | awk 'NR==1{print $2; exit}')
curl -Sfso/dev/null "http://localhost:${PORT}/healthz"
