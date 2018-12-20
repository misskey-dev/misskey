(
  .data |
  map(
    select(
      .relationships
      .currently_entitled_tiers
      .data[]
    )
  ) |
  map(
    .relationships
    .user
    .data
    .id
  )
) as $data |
.included |
map(
  select(
    .id as $id |
    $data |
    contains(
      [
        $id
      ]
    )
  )
) |
map(
  .attributes |
  [
    .full_name,
    .thumb_url,
    .url
  ] |
  @tsv
) |
.[] |
@text
