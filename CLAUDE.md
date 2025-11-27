# Yamisskey - Privacy-First Misskey Fork

## Project Overview

Yamisskey is a privacy-focused and psychologically safe fork of [Misskey](https://github.com/misskey-dev/misskey), an open-source federated social media platform. This fork prioritizes user privacy and mental health over engagement metrics.

## Core Philosophy

### Privacy Protection (秘匿化)
- **Login-required content**: Local timeline, user profiles, and federated notes require authentication
- **Hidden metadata**: URL previews strip metadata, profile information can be hidden
- **Configurable visibility**: Users can hide file lists, activity, note counts, follower/following counts
- **RSS feed protection**: Respects "make account discoverable" and "login required" settings

### Psychological Safety (心理的安全)
- **Auto-reject follow requests**: Reduces social pressure
- **Temporary notes (時限消滅)**: Notes can auto-delete, with configurable defaults
- **Anonymous reactions**: Option to hide who reacted to posts
- **Reaction hiding**: Can hide reaction counts and reactions from muted users
- **Dark mode features**: Yami mode, yami notes, yami timeline for reduced visibility
- **Private posting**: "Private" scope (visible only to self)

### Enhanced Features (機能追加)
- **Federation improvements**: Reversi game federation support
- **LaTeX support**: Restored v13 LaTeX notation
- **Customization**: User nicknames, custom fonts, server info icons
- **Timeline controls**: Users can hide LTL/STL/GTL
- **Scheduling**: Note scheduling support
- **Additional widgets**: ListenBrainz, Jitsi Meet, Active Users
- **Community roles**: Enhanced role system

## Development Workflow

### Branch Structure
- **`master`** (Production): Stable yamisskey with `-yami-` versioning (e.g., `2025.1.0-yami-1.4.3`)
- **`nayami`** (Testing): Testing environment with `-nayami-` versioning 
- **`muyami`** (Development): Active development with `-muyami-` versioning

### Release Flow
Development flows: `muyami` → `nayami` → `master`

### Version Management
Each branch uses distinct version suffixes:
- Production: `version-yami-x.x.x`
- Testing: `version-nayami-x.x.x`  
- Development: `version-muyami-x.x.x`

## Key Code Areas

### Backend Privacy Features
- **API Endpoints**: Enhanced privacy controls in user and timeline endpoints
- **Entity Services**: Modified user entity service for selective information hiding
- **Migration Files**: Database schema changes for privacy features
- **Stream Channels**: Custom yami-timeline implementation

### Frontend Privacy Controls
- **Settings Pages**: Privacy configuration UI (`packages/frontend/src/pages/settings/privacy.vue`)
- **User Interface**: Modified user home and visitor dashboard
- **Preferences**: Privacy-related preference definitions
- **Components**: Enhanced auth and user display components

### Important Files to Review
- `packages/backend/src/core/entities/UserEntityService.ts` - User data exposure controls
- `packages/backend/src/server/api/endpoints/notes/*-timeline.ts` - Timeline privacy logic
- `packages/backend/src/server/api/endpoints/i/update.ts` - User setting updates
- `packages/frontend/src/pages/settings/privacy.vue` - Privacy settings UI
- `packages/frontend/src/preferences/def.ts` - Default privacy preferences
- `packages/misskey-js/src/autogen/types.ts` - Type definitions for privacy features

## Code Review Guidelines

### Privacy Considerations
1. **Data Exposure**: Ensure no private information leaks through APIs
2. **Authentication Checks**: Verify login requirements are enforced
3. **Default Privacy**: New features should default to most private settings
4. **Backward Compatibility**: Privacy changes shouldn't break existing privacy expectations

### Performance Impact
1. **Database Queries**: Privacy features often add query complexity
2. **Caching**: Consider cache invalidation for privacy-related changes
3. **Federation**: Ensure privacy features work correctly with remote instances

### Security Review
1. **Authorization**: Verify proper permission checks for privacy features
2. **Information Disclosure**: Check for potential information leaks
3. **Input Validation**: Validate privacy setting inputs
4. **Rate Limiting**: Consider rate limiting for privacy-sensitive endpoints

### Testing Requirements
1. **Privacy Scenarios**: Test both public and private visibility modes
2. **Edge Cases**: Test with various privacy setting combinations
3. **Federation**: Test privacy features with remote instances
4. **Migration**: Verify database migrations maintain privacy expectations

## Architecture Notes

### Privacy Layer Implementation
Privacy features are implemented at multiple layers:
- **Database**: Schema supports privacy flags and settings
- **API**: Endpoints filter responses based on privacy settings
- **Frontend**: UI respects privacy preferences
- **Federation**: ActivityPub messages respect privacy choices

### Custom Extensions
- **Yami Timeline**: Custom timeline type for enhanced privacy
- **Reaction Privacy**: Extended reaction system with anonymity options
- **User Visibility**: Granular control over profile information exposure

## Common Patterns

### Privacy Checks
```typescript
// Typical privacy check pattern
if (user.hideActivity && !isOwner) {
  // Hide activity information
}
```

### Setting Defaults
```typescript
// Privacy-first defaults
const defaultSettings = {
  hideFollowersCount: true,
  requireLoginForContent: true,
  // ...
};
```

## Upstream Integration

When merging from upstream Misskey:
1. **Selective Integration**: Only merge features that align with privacy philosophy
2. **Privacy Impact**: Assess how new features affect user privacy
3. **Default Overrides**: Ensure new features default to privacy-preserving settings
4. **Documentation**: Update privacy feature documentation

## Quality Standards

- Maintain high code quality standards from upstream Misskey
- Ensure all privacy features are well-documented
- Preserve existing privacy guarantees when adding new features
- Test privacy features thoroughly across different user scenarios
