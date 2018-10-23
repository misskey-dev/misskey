#!/usr/bin/env bash
# __MISSKEY_BEARER_TOKEN=
# __MISSKEY_CAMPAIGN_ID=
# __MISSKEY_GITHUB_TOKEN=
# __MISSKEY_HEAD=acid-chicken:patch-autogen
# __MISSKEY_REPO=syuilo/misskey
# __MISSKEY_BRANCH=develop
test "$(curl -LSs -w '\n' -- "https://api.github.com/repos/$REPO/pulls?access_token=$__MISSKEY_GITHUB_TOKEN" | jq -r '.[].head.label' | grep $__MISSKEY_HEAD)" && exit 1
cd "$(dirname $0)/.." && \
touch null.cache && \
rm *.cache && \
git checkout $__MISSKEY_BRANCH && \
git pull origin $__MISSKEY_BRANCH && \
git pull upstream $__MISSKEY_BRANCH && \
git stash && \
git rebase -f upstream/$__MISSKEY_BRANCH && \
git branch patch-autogen && \
git checkout patch-autogen && \
git reset --hard HEAD || \
exit 1
touch patreon.md.cache && \
rm patreon.md.cache && \
echo '<!-- PATREON_START -->' > patreon.md.cache && \
url="https://www.patreon.com/api/oauth2/v2/campaigns/$__MISSKEY_CAMPAIGN_ID/members?include=currently_entitled_tiers,user&fields%5Btier%5D=title&fields%5Buser%5D=full_name,thumb_url,url,hide_pledges"
while :
 do
  touch patreon.raw.cache && \
  rm patreon.raw.cache && \
  curl -LSs -w '\n' -H "Authorization: Bearer $__MISSKEY_BEARER_TOKEN" -- $url > patreon.raw.cache && \
  touch patreon.cache && \
  rm patreon.cache && \
  cat patreon.raw.cache | \
  jq -r '(.data|map(select(.relationships.currently_entitled_tiers.data[]))|map(.relationships.user.data.id))as$data|.included|map(select(.id as$id|$data|contains([$id])))|map(.attributes|[.full_name,.thumb_url,.url]|@tsv)|.[]|@text' >> patreon.cache && \
  echo '<table><tr>' >> patreon.md.cache && \
  cat patreon.cache | \
  awk -F'\t' '{print $2,$1}' | \
  sed -e 's/ /\\" alt=\\"/' | \
  xargs -I% echo '<td><img src="%"></td>' >> patreon.md.cache && \
  echo '</tr><tr>' >> patreon.md.cache && \
  cat patreon.cache | \
  awk -F'\t' '{print $3,$1}' | \
  sed -e 's/ /\\">/' | \
  xargs -I% echo '<td><a href="%</a></td>' >> patreon.md.cache && \
  echo '</tr></table>' >> patreon.md.cache || \
  exit 1
  new_url="$(cat patreon.raw.cache | jq -r '.links.next')"
  test "$new_url" = 'null' && \
  break || \
  URL="$url"
done
ignore= && \
echo -e "\n**Last updated:** $(date -uR | sed 's/\+0000/UTC/')\n<!-- PATREON_END -->" >> patreon.md.cache && \
touch README.md && \
touch .autogen/README.md && \
rm .autogen/README.md && \
mv README.md .autogen/README.md && \
cat .autogen/README.md | while IFS= read line;
 do
  if [[ -z "$ignore" ]]
   then
    if [[ "$line" = '<!-- PATREON_START -->' ]]
     then
      ignore='PATREON_INSIDE'
     else
      echo "$line" >> README.md
    fi
   else
    if [[ "$LINE" = '<!-- PATREON_END -->' ]]
     then
      ignore=
      cat patreon.md.cache >> README.md
    fi
  fi
done
cat patreon.md.cache
touch null.cache && \
rm *.cache && \
diff .autogen/README.md README.md > diff.cache
cat diff.cache && \
test 4 -lt $(cat diff.cache | wc -l) && \
git add README.md && \
git commit -m 'Update README.md [AUTOGEN]' && \
git push -f origin patch-autogen && \
curl -LSs -w '\n' -X POST -d '{"title":"[AUTOMATED] Update README.md","body":"*This pull request was created by a tool.*","head":"'$__MISSKEY_HEAD'","base":"'$__MISSKEY_BRANCH'"}' -- "https://api.github.com/repos/$__MISSKEY_REPO/pulls?access_token=$__MISSKEY_GITHUB_TOKEN"
git stash
git checkout $__MISSKEY_BRANCH
git branch -D patch-autogen
