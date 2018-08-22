#!/usr/bin/env bash
# BEARER_TOKEN=
# CAMPAIGN_ID=
# GITHUB_TOKEN=
# HEAD='acid-chicken:patch-autogen'
# REPO='syuilo/misskey'
test "$(curl -LSs -w '\n' -- "https://api.github.com/repos/$REPO/pulls?access_token=$GITHUB_TOKEN" | jq -r '.[].head.label' | grep $HEAD)" && exit 1
cd "$(dirname $0)/.." && \
touch null.cache && \
rm *.cache && \
git checkout master && \
git pull origin master && \
git pull upstream master && \
git stash && \
git rebase -f upstream/master && \
git branch patch-autogen && \
git checkout patch-autogen && \
git reset --hard HEAD || \
exit 1
touch patreon.md.cache && \
rm patreon.md.cache && \
echo '<!-- PATREON_START -->' > patreon.md.cache && \
URL="https://www.patreon.com/api/oauth2/v2/campaigns/$CAMPAIGN_ID/members?include=currently_entitled_tiers,user&fields%5Btier%5D=title&fields%5Buser%5D=full_name,thumb_url,url,hide_pledges"
while :
 do
  touch patreon.raw.cache && \
  rm patreon.raw.cache && \
  curl -LSs -w '\n' -H "Authorization: Bearer $BEARER_TOKEN" -- $URL > patreon.raw.cache && \
  touch patreon.cache && \
  rm patreon.cache && \
  cat patreon.raw.cache | \
  jq -r '(.data|map(select(.relationships.currently_entitled_tiers.data[]))|map(.relationships.user.data.id))as$data|.included|map(select(.attributes.hide_pledges==false))|map(select(.id as$id|$data|contains([$id])))|map(.attributes|[.full_name,.thumb_url,.url]|@tsv)|.[]|@text' >> patreon.cache && \
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
  NEW_URL="$(cat patreon.raw.cache | jq -r '.links.next')"
  test "$NEW_URL" = 'null' && \
  break || \
  URL="$NEW_URL"
done
IGNORE= && \
echo -e "\n**Last updated:** $(date -uR | sed 's/\+0000/UTC/')\n<!-- PATREON_END -->" >> patreon.md.cache && \
touch README.md && \
touch .autogen/README.md && \
rm .autogen/README.md && \
mv README.md .autogen/README.md && \
cat .autogen/README.md | while IFS= read LINE;
 do
  if [[ -z "$IGNORE" ]]
   then
    if [[ "$LINE" = '<!-- PATREON_START -->' ]]
     then
      IGNORE='PATREON_INSIDE'
     else
      echo "$LINE" >> README.md
    fi
   else
    if [[ "$LINE" = '<!-- PATREON_END -->' ]]
     then
      IGNORE=
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
curl -LSs -w '\n' -X POST -d '{"title":"[AUTOMATED] Update README.md","body":"*This pull request was created by a tool.*","head":"'$HEAD'","base":"master"}' -- "https://api.github.com/repos/$REPO/pulls?access_token=$GITHUB_TOKEN"
git stash
git checkout master
git branch -D patch-autogen
