import type {
	EmptyRequest,
	EmptyResponse,
	AdminMetaResponse,
	AdminAbuseUserReportsRequest,
	AdminAbuseUserReportsResponse,
	AdminAbuseReportNotificationRecipientListRequest,
	AdminAbuseReportNotificationRecipientListResponse,
	AdminAbuseReportNotificationRecipientShowRequest,
	AdminAbuseReportNotificationRecipientShowResponse,
	AdminAbuseReportNotificationRecipientCreateRequest,
	AdminAbuseReportNotificationRecipientCreateResponse,
	AdminAbuseReportNotificationRecipientUpdateRequest,
	AdminAbuseReportNotificationRecipientUpdateResponse,
	AdminAbuseReportNotificationRecipientDeleteRequest,
	AdminAccountsCreateRequest,
	AdminAccountsCreateResponse,
	AdminAccountsDeleteRequest,
	AdminAccountsFindByEmailRequest,
	AdminAccountsFindByEmailResponse,
	AdminAdCreateRequest,
	AdminAdCreateResponse,
	AdminAdDeleteRequest,
	AdminAdListRequest,
	AdminAdListResponse,
	AdminAdUpdateRequest,
	AdminAnnouncementsCreateRequest,
	AdminAnnouncementsCreateResponse,
	AdminAnnouncementsDeleteRequest,
	AdminAnnouncementsListRequest,
	AdminAnnouncementsListResponse,
	AdminAnnouncementsUpdateRequest,
	AdminAvatarDecorationsCreateRequest,
	AdminAvatarDecorationsDeleteRequest,
	AdminAvatarDecorationsListRequest,
	AdminAvatarDecorationsListResponse,
	AdminAvatarDecorationsUpdateRequest,
	AdminDeleteAllFilesOfAUserRequest,
	AdminUnsetUserAvatarRequest,
	AdminUnsetUserBannerRequest,
	AdminDriveFilesRequest,
	AdminDriveFilesResponse,
	AdminDriveShowFileRequest,
	AdminDriveShowFileResponse,
	AdminEmojiAddAliasesBulkRequest,
	AdminEmojiAddRequest,
	AdminEmojiAddResponse,
	AdminEmojiCopyRequest,
	AdminEmojiCopyResponse,
	AdminEmojiDeleteBulkRequest,
	AdminEmojiDeleteRequest,
	AdminEmojiImportZipRequest,
	AdminEmojiListRemoteRequest,
	AdminEmojiListRemoteResponse,
	AdminEmojiListRequest,
	AdminEmojiListResponse,
	AdminEmojiRemoveAliasesBulkRequest,
	AdminEmojiSetAliasesBulkRequest,
	AdminEmojiSetCategoryBulkRequest,
	AdminEmojiSetLicenseBulkRequest,
	AdminEmojiUpdateRequest,
	AdminFederationDeleteAllFilesRequest,
	AdminFederationRefreshRemoteInstanceMetadataRequest,
	AdminFederationRemoveAllFollowingRequest,
	AdminFederationUpdateInstanceRequest,
	AdminGetIndexStatsResponse,
	AdminGetTableStatsResponse,
	AdminGetUserIpsRequest,
	AdminGetUserIpsResponse,
	AdminInviteCreateRequest,
	AdminInviteCreateResponse,
	AdminInviteListRequest,
	AdminInviteListResponse,
	AdminPromoCreateRequest,
	AdminQueueDeliverDelayedResponse,
	AdminQueueInboxDelayedResponse,
	AdminQueuePromoteRequest,
	AdminQueueStatsResponse,
	AdminRelaysAddRequest,
	AdminRelaysAddResponse,
	AdminRelaysListResponse,
	AdminRelaysRemoveRequest,
	AdminResetPasswordRequest,
	AdminResetPasswordResponse,
	AdminResolveAbuseUserReportRequest,
	AdminSendEmailRequest,
	AdminServerInfoResponse,
	AdminShowModerationLogsRequest,
	AdminShowModerationLogsResponse,
	AdminShowUserRequest,
	AdminShowUserResponse,
	AdminShowUsersRequest,
	AdminShowUsersResponse,
	AdminSuspendUserRequest,
	AdminUnsuspendUserRequest,
	AdminUpdateMetaRequest,
	AdminDeleteAccountRequest,
	AdminUpdateUserNoteRequest,
	AdminRolesCreateRequest,
	AdminRolesCreateResponse,
	AdminRolesDeleteRequest,
	AdminRolesListResponse,
	AdminRolesShowRequest,
	AdminRolesShowResponse,
	AdminRolesUpdateRequest,
	AdminRolesAssignRequest,
	AdminRolesUnassignRequest,
	AdminRolesUpdateDefaultPoliciesRequest,
	AdminRolesUsersRequest,
	AdminRolesUsersResponse,
	AdminSystemWebhookCreateRequest,
	AdminSystemWebhookCreateResponse,
	AdminSystemWebhookDeleteRequest,
	AdminSystemWebhookListRequest,
	AdminSystemWebhookListResponse,
	AdminSystemWebhookShowRequest,
	AdminSystemWebhookShowResponse,
	AdminSystemWebhookUpdateRequest,
	AdminSystemWebhookUpdateResponse,
	AnnouncementsRequest,
	AnnouncementsResponse,
	AnnouncementsShowRequest,
	AnnouncementsShowResponse,
	AntennasCreateRequest,
	AntennasCreateResponse,
	AntennasDeleteRequest,
	AntennasListResponse,
	AntennasNotesRequest,
	AntennasNotesResponse,
	AntennasShowRequest,
	AntennasShowResponse,
	AntennasUpdateRequest,
	AntennasUpdateResponse,
	ApGetRequest,
	ApGetResponse,
	ApShowRequest,
	ApShowResponse,
	AppCreateRequest,
	AppCreateResponse,
	AppShowRequest,
	AppShowResponse,
	AuthAcceptRequest,
	AuthSessionGenerateRequest,
	AuthSessionGenerateResponse,
	AuthSessionShowRequest,
	AuthSessionShowResponse,
	AuthSessionUserkeyRequest,
	AuthSessionUserkeyResponse,
	BlockingCreateRequest,
	BlockingCreateResponse,
	BlockingDeleteRequest,
	BlockingDeleteResponse,
	BlockingListRequest,
	BlockingListResponse,
	ChannelsCreateRequest,
	ChannelsCreateResponse,
	ChannelsFeaturedResponse,
	ChannelsFollowRequest,
	ChannelsFollowedRequest,
	ChannelsFollowedResponse,
	ChannelsOwnedRequest,
	ChannelsOwnedResponse,
	ChannelsShowRequest,
	ChannelsShowResponse,
	ChannelsTimelineRequest,
	ChannelsTimelineResponse,
	ChannelsUnfollowRequest,
	ChannelsUpdateRequest,
	ChannelsUpdateResponse,
	ChannelsFavoriteRequest,
	ChannelsUnfavoriteRequest,
	ChannelsMyFavoritesResponse,
	ChannelsSearchRequest,
	ChannelsSearchResponse,
	ChartsActiveUsersRequest,
	ChartsActiveUsersResponse,
	ChartsApRequestRequest,
	ChartsApRequestResponse,
	ChartsDriveRequest,
	ChartsDriveResponse,
	ChartsFederationRequest,
	ChartsFederationResponse,
	ChartsInstanceRequest,
	ChartsInstanceResponse,
	ChartsNotesRequest,
	ChartsNotesResponse,
	ChartsUserDriveRequest,
	ChartsUserDriveResponse,
	ChartsUserFollowingRequest,
	ChartsUserFollowingResponse,
	ChartsUserNotesRequest,
	ChartsUserNotesResponse,
	ChartsUserPvRequest,
	ChartsUserPvResponse,
	ChartsUserReactionsRequest,
	ChartsUserReactionsResponse,
	ChartsUsersRequest,
	ChartsUsersResponse,
	ClipsAddNoteRequest,
	ClipsRemoveNoteRequest,
	ClipsCreateRequest,
	ClipsCreateResponse,
	ClipsDeleteRequest,
	ClipsListResponse,
	ClipsNotesRequest,
	ClipsNotesResponse,
	ClipsShowRequest,
	ClipsShowResponse,
	ClipsUpdateRequest,
	ClipsUpdateResponse,
	ClipsFavoriteRequest,
	ClipsUnfavoriteRequest,
	ClipsMyFavoritesResponse,
	DriveResponse,
	DriveFilesRequest,
	DriveFilesResponse,
	DriveFilesAttachedNotesRequest,
	DriveFilesAttachedNotesResponse,
	DriveFilesCheckExistenceRequest,
	DriveFilesCheckExistenceResponse,
	DriveFilesCreateRequest,
	DriveFilesCreateResponse,
	DriveFilesDeleteRequest,
	DriveFilesFindByHashRequest,
	DriveFilesFindByHashResponse,
	DriveFilesFindRequest,
	DriveFilesFindResponse,
	DriveFilesShowRequest,
	DriveFilesShowResponse,
	DriveFilesUpdateRequest,
	DriveFilesUpdateResponse,
	DriveFilesUploadFromUrlRequest,
	DriveFoldersRequest,
	DriveFoldersResponse,
	DriveFoldersCreateRequest,
	DriveFoldersCreateResponse,
	DriveFoldersDeleteRequest,
	DriveFoldersFindRequest,
	DriveFoldersFindResponse,
	DriveFoldersShowRequest,
	DriveFoldersShowResponse,
	DriveFoldersUpdateRequest,
	DriveFoldersUpdateResponse,
	DriveStreamRequest,
	DriveStreamResponse,
	EmailAddressAvailableRequest,
	EmailAddressAvailableResponse,
	EndpointRequest,
	EndpointResponse,
	EndpointsResponse,
	FederationFollowersRequest,
	FederationFollowersResponse,
	FederationFollowingRequest,
	FederationFollowingResponse,
	FederationInstancesRequest,
	FederationInstancesResponse,
	FederationShowInstanceRequest,
	FederationShowInstanceResponse,
	FederationUpdateRemoteUserRequest,
	FederationUsersRequest,
	FederationUsersResponse,
	FederationStatsRequest,
	FederationStatsResponse,
	FollowingCreateRequest,
	FollowingCreateResponse,
	FollowingDeleteRequest,
	FollowingDeleteResponse,
	FollowingUpdateRequest,
	FollowingUpdateResponse,
	FollowingUpdateAllRequest,
	FollowingInvalidateRequest,
	FollowingInvalidateResponse,
	FollowingRequestsAcceptRequest,
	FollowingRequestsCancelRequest,
	FollowingRequestsCancelResponse,
	FollowingRequestsListRequest,
	FollowingRequestsListResponse,
	FollowingRequestsRejectRequest,
	GalleryFeaturedRequest,
	GalleryFeaturedResponse,
	GalleryPopularResponse,
	GalleryPostsRequest,
	GalleryPostsResponse,
	GalleryPostsCreateRequest,
	GalleryPostsCreateResponse,
	GalleryPostsDeleteRequest,
	GalleryPostsLikeRequest,
	GalleryPostsShowRequest,
	GalleryPostsShowResponse,
	GalleryPostsUnlikeRequest,
	GalleryPostsUpdateRequest,
	GalleryPostsUpdateResponse,
	GetOnlineUsersCountResponse,
	GetAvatarDecorationsResponse,
	HashtagsListRequest,
	HashtagsListResponse,
	HashtagsSearchRequest,
	HashtagsSearchResponse,
	HashtagsShowRequest,
	HashtagsShowResponse,
	HashtagsTrendResponse,
	HashtagsUsersRequest,
	HashtagsUsersResponse,
	IResponse,
	I2faDoneRequest,
	I2faDoneResponse,
	I2faKeyDoneRequest,
	I2faKeyDoneResponse,
	I2faPasswordLessRequest,
	I2faRegisterKeyRequest,
	I2faRegisterKeyResponse,
	I2faRegisterRequest,
	I2faRegisterResponse,
	I2faUpdateKeyRequest,
	I2faRemoveKeyRequest,
	I2faUnregisterRequest,
	IAppsRequest,
	IAppsResponse,
	IAuthorizedAppsRequest,
	IAuthorizedAppsResponse,
	IClaimAchievementRequest,
	IChangePasswordRequest,
	IDeleteAccountRequest,
	IExportFollowingRequest,
	IFavoritesRequest,
	IFavoritesResponse,
	IGalleryLikesRequest,
	IGalleryLikesResponse,
	IGalleryPostsRequest,
	IGalleryPostsResponse,
	IImportBlockingRequest,
	IImportFollowingRequest,
	IImportMutingRequest,
	IImportUserListsRequest,
	IImportAntennasRequest,
	INotificationsRequest,
	INotificationsResponse,
	INotificationsGroupedRequest,
	INotificationsGroupedResponse,
	IPageLikesRequest,
	IPageLikesResponse,
	IPagesRequest,
	IPagesResponse,
	IPinRequest,
	IPinResponse,
	IReadAnnouncementRequest,
	IRegenerateTokenRequest,
	IRegistryGetAllRequest,
	IRegistryGetAllResponse,
	IRegistryGetDetailRequest,
	IRegistryGetDetailResponse,
	IRegistryGetRequest,
	IRegistryGetResponse,
	IRegistryKeysWithTypeRequest,
	IRegistryKeysWithTypeResponse,
	IRegistryKeysRequest,
	IRegistryKeysResponse,
	IRegistryRemoveRequest,
	IRegistryScopesWithDomainResponse,
	IRegistrySetRequest,
	IRevokeTokenRequest,
	ISigninHistoryRequest,
	ISigninHistoryResponse,
	IUnpinRequest,
	IUnpinResponse,
	IUpdateEmailRequest,
	IUpdateEmailResponse,
	IUpdateRequest,
	IUpdateResponse,
	IMoveRequest,
	IMoveResponse,
	IWebhooksCreateRequest,
	IWebhooksCreateResponse,
	IWebhooksListResponse,
	IWebhooksShowRequest,
	IWebhooksShowResponse,
	IWebhooksUpdateRequest,
	IWebhooksDeleteRequest,
	InviteCreateResponse,
	InviteDeleteRequest,
	InviteListRequest,
	InviteListResponse,
	InviteLimitResponse,
	MetaRequest,
	MetaResponse,
	EmojisResponse,
	EmojiRequest,
	EmojiResponse,
	MiauthGenTokenRequest,
	MiauthGenTokenResponse,
	MuteCreateRequest,
	MuteDeleteRequest,
	MuteListRequest,
	MuteListResponse,
	RenoteMuteCreateRequest,
	RenoteMuteDeleteRequest,
	RenoteMuteListRequest,
	RenoteMuteListResponse,
	MyAppsRequest,
	MyAppsResponse,
	NotesRequest,
	NotesResponse,
	NotesChildrenRequest,
	NotesChildrenResponse,
	NotesClipsRequest,
	NotesClipsResponse,
	NotesConversationRequest,
	NotesConversationResponse,
	NotesCreateRequest,
	NotesCreateResponse,
	NotesDeleteRequest,
	NotesFavoritesCreateRequest,
	NotesFavoritesDeleteRequest,
	NotesFeaturedRequest,
	NotesFeaturedResponse,
	NotesGlobalTimelineRequest,
	NotesGlobalTimelineResponse,
	NotesHybridTimelineRequest,
	NotesHybridTimelineResponse,
	NotesLocalTimelineRequest,
	NotesLocalTimelineResponse,
	NotesMentionsRequest,
	NotesMentionsResponse,
	NotesPollsRecommendationRequest,
	NotesPollsRecommendationResponse,
	NotesPollsVoteRequest,
	NotesReactionsRequest,
	NotesReactionsResponse,
	NotesReactionsCreateRequest,
	NotesReactionsDeleteRequest,
	NotesRenotesRequest,
	NotesRenotesResponse,
	NotesRepliesRequest,
	NotesRepliesResponse,
	NotesSearchByTagRequest,
	NotesSearchByTagResponse,
	NotesSearchRequest,
	NotesSearchResponse,
	NotesShowRequest,
	NotesShowResponse,
	NotesStateRequest,
	NotesStateResponse,
	NotesThreadMutingCreateRequest,
	NotesThreadMutingDeleteRequest,
	NotesTimelineRequest,
	NotesTimelineResponse,
	NotesTranslateRequest,
	NotesTranslateResponse,
	NotesUnrenoteRequest,
	NotesUserListTimelineRequest,
	NotesUserListTimelineResponse,
	NotificationsCreateRequest,
	PagePushRequest,
	PagesCreateRequest,
	PagesCreateResponse,
	PagesDeleteRequest,
	PagesFeaturedResponse,
	PagesLikeRequest,
	PagesShowRequest,
	PagesShowResponse,
	PagesUnlikeRequest,
	PagesUpdateRequest,
	FlashCreateRequest,
	FlashCreateResponse,
	FlashDeleteRequest,
	FlashFeaturedResponse,
	FlashLikeRequest,
	FlashShowRequest,
	FlashShowResponse,
	FlashUnlikeRequest,
	FlashUpdateRequest,
	FlashMyRequest,
	FlashMyResponse,
	FlashMyLikesRequest,
	FlashMyLikesResponse,
	PingResponse,
	PinnedUsersResponse,
	PromoReadRequest,
	RolesListResponse,
	RolesShowRequest,
	RolesShowResponse,
	RolesUsersRequest,
	RolesUsersResponse,
	RolesNotesRequest,
	RolesNotesResponse,
	RequestResetPasswordRequest,
	ResetPasswordRequest,
	ServerInfoResponse,
	StatsResponse,
	SwShowRegistrationRequest,
	SwShowRegistrationResponse,
	SwUpdateRegistrationRequest,
	SwUpdateRegistrationResponse,
	SwRegisterRequest,
	SwRegisterResponse,
	SwUnregisterRequest,
	TestRequest,
	TestResponse,
	UsernameAvailableRequest,
	UsernameAvailableResponse,
	UsersRequest,
	UsersResponse,
	UsersClipsRequest,
	UsersClipsResponse,
	UsersFollowersRequest,
	UsersFollowersResponse,
	UsersFollowingRequest,
	UsersFollowingResponse,
	UsersGalleryPostsRequest,
	UsersGalleryPostsResponse,
	UsersGetFrequentlyRepliedUsersRequest,
	UsersGetFrequentlyRepliedUsersResponse,
	UsersFeaturedNotesRequest,
	UsersFeaturedNotesResponse,
	UsersListsCreateRequest,
	UsersListsCreateResponse,
	UsersListsDeleteRequest,
	UsersListsListRequest,
	UsersListsListResponse,
	UsersListsPullRequest,
	UsersListsPushRequest,
	UsersListsShowRequest,
	UsersListsShowResponse,
	UsersListsFavoriteRequest,
	UsersListsUnfavoriteRequest,
	UsersListsUpdateRequest,
	UsersListsUpdateResponse,
	UsersListsCreateFromPublicRequest,
	UsersListsCreateFromPublicResponse,
	UsersListsUpdateMembershipRequest,
	UsersListsGetMembershipsRequest,
	UsersListsGetMembershipsResponse,
	UsersNotesRequest,
	UsersNotesResponse,
	UsersPagesRequest,
	UsersPagesResponse,
	UsersFlashsRequest,
	UsersFlashsResponse,
	UsersReactionsRequest,
	UsersReactionsResponse,
	UsersRecommendationRequest,
	UsersRecommendationResponse,
	UsersRelationRequest,
	UsersRelationResponse,
	UsersReportAbuseRequest,
	UsersSearchByUsernameAndHostRequest,
	UsersSearchByUsernameAndHostResponse,
	UsersSearchRequest,
	UsersSearchResponse,
	UsersShowRequest,
	UsersShowResponse,
	UsersAchievementsRequest,
	UsersAchievementsResponse,
	UsersUpdateMemoRequest,
	FetchRssRequest,
	FetchRssResponse,
	FetchExternalResourcesRequest,
	FetchExternalResourcesResponse,
	RetentionResponse,
	BubbleGameRegisterRequest,
	BubbleGameRankingRequest,
	BubbleGameRankingResponse,
	ReversiCancelMatchRequest,
	ReversiGamesRequest,
	ReversiGamesResponse,
	ReversiMatchRequest,
	ReversiMatchResponse,
	ReversiInvitationsResponse,
	ReversiShowGameRequest,
	ReversiShowGameResponse,
	ReversiSurrenderRequest,
	ReversiVerifyRequest,
	ReversiVerifyResponse,
} from './entities.js';

export type Endpoints = {
	'admin/meta': { req: EmptyRequest; res: AdminMetaResponse };
	'admin/abuse-user-reports': { req: AdminAbuseUserReportsRequest; res: AdminAbuseUserReportsResponse };
	'admin/abuse-report/notification-recipient/list': { req: AdminAbuseReportNotificationRecipientListRequest; res: AdminAbuseReportNotificationRecipientListResponse };
	'admin/abuse-report/notification-recipient/show': { req: AdminAbuseReportNotificationRecipientShowRequest; res: AdminAbuseReportNotificationRecipientShowResponse };
	'admin/abuse-report/notification-recipient/create': { req: AdminAbuseReportNotificationRecipientCreateRequest; res: AdminAbuseReportNotificationRecipientCreateResponse };
	'admin/abuse-report/notification-recipient/update': { req: AdminAbuseReportNotificationRecipientUpdateRequest; res: AdminAbuseReportNotificationRecipientUpdateResponse };
	'admin/abuse-report/notification-recipient/delete': { req: AdminAbuseReportNotificationRecipientDeleteRequest; res: EmptyResponse };
	'admin/accounts/create': { req: AdminAccountsCreateRequest; res: AdminAccountsCreateResponse };
	'admin/accounts/delete': { req: AdminAccountsDeleteRequest; res: EmptyResponse };
	'admin/accounts/find-by-email': { req: AdminAccountsFindByEmailRequest; res: AdminAccountsFindByEmailResponse };
	'admin/ad/create': { req: AdminAdCreateRequest; res: AdminAdCreateResponse };
	'admin/ad/delete': { req: AdminAdDeleteRequest; res: EmptyResponse };
	'admin/ad/list': { req: AdminAdListRequest; res: AdminAdListResponse };
	'admin/ad/update': { req: AdminAdUpdateRequest; res: EmptyResponse };
	'admin/announcements/create': { req: AdminAnnouncementsCreateRequest; res: AdminAnnouncementsCreateResponse };
	'admin/announcements/delete': { req: AdminAnnouncementsDeleteRequest; res: EmptyResponse };
	'admin/announcements/list': { req: AdminAnnouncementsListRequest; res: AdminAnnouncementsListResponse };
	'admin/announcements/update': { req: AdminAnnouncementsUpdateRequest; res: EmptyResponse };
	'admin/avatar-decorations/create': { req: AdminAvatarDecorationsCreateRequest; res: EmptyResponse };
	'admin/avatar-decorations/delete': { req: AdminAvatarDecorationsDeleteRequest; res: EmptyResponse };
	'admin/avatar-decorations/list': { req: AdminAvatarDecorationsListRequest; res: AdminAvatarDecorationsListResponse };
	'admin/avatar-decorations/update': { req: AdminAvatarDecorationsUpdateRequest; res: EmptyResponse };
	'admin/delete-all-files-of-a-user': { req: AdminDeleteAllFilesOfAUserRequest; res: EmptyResponse };
	'admin/unset-user-avatar': { req: AdminUnsetUserAvatarRequest; res: EmptyResponse };
	'admin/unset-user-banner': { req: AdminUnsetUserBannerRequest; res: EmptyResponse };
	'admin/drive/clean-remote-files': { req: EmptyRequest; res: EmptyResponse };
	'admin/drive/cleanup': { req: EmptyRequest; res: EmptyResponse };
	'admin/drive/files': { req: AdminDriveFilesRequest; res: AdminDriveFilesResponse };
	'admin/drive/show-file': { req: AdminDriveShowFileRequest; res: AdminDriveShowFileResponse };
	'admin/emoji/add-aliases-bulk': { req: AdminEmojiAddAliasesBulkRequest; res: EmptyResponse };
	'admin/emoji/add': { req: AdminEmojiAddRequest; res: AdminEmojiAddResponse };
	'admin/emoji/copy': { req: AdminEmojiCopyRequest; res: AdminEmojiCopyResponse };
	'admin/emoji/delete-bulk': { req: AdminEmojiDeleteBulkRequest; res: EmptyResponse };
	'admin/emoji/delete': { req: AdminEmojiDeleteRequest; res: EmptyResponse };
	'admin/emoji/import-zip': { req: AdminEmojiImportZipRequest; res: EmptyResponse };
	'admin/emoji/list-remote': { req: AdminEmojiListRemoteRequest; res: AdminEmojiListRemoteResponse };
	'admin/emoji/list': { req: AdminEmojiListRequest; res: AdminEmojiListResponse };
	'admin/emoji/remove-aliases-bulk': { req: AdminEmojiRemoveAliasesBulkRequest; res: EmptyResponse };
	'admin/emoji/set-aliases-bulk': { req: AdminEmojiSetAliasesBulkRequest; res: EmptyResponse };
	'admin/emoji/set-category-bulk': { req: AdminEmojiSetCategoryBulkRequest; res: EmptyResponse };
	'admin/emoji/set-license-bulk': { req: AdminEmojiSetLicenseBulkRequest; res: EmptyResponse };
	'admin/emoji/update': { req: AdminEmojiUpdateRequest; res: EmptyResponse };
	'admin/federation/delete-all-files': { req: AdminFederationDeleteAllFilesRequest; res: EmptyResponse };
	'admin/federation/refresh-remote-instance-metadata': { req: AdminFederationRefreshRemoteInstanceMetadataRequest; res: EmptyResponse };
	'admin/federation/remove-all-following': { req: AdminFederationRemoveAllFollowingRequest; res: EmptyResponse };
	'admin/federation/update-instance': { req: AdminFederationUpdateInstanceRequest; res: EmptyResponse };
	'admin/get-index-stats': { req: EmptyRequest; res: AdminGetIndexStatsResponse };
	'admin/get-table-stats': { req: EmptyRequest; res: AdminGetTableStatsResponse };
	'admin/get-user-ips': { req: AdminGetUserIpsRequest; res: AdminGetUserIpsResponse };
	'admin/invite/create': { req: AdminInviteCreateRequest; res: AdminInviteCreateResponse };
	'admin/invite/list': { req: AdminInviteListRequest; res: AdminInviteListResponse };
	'admin/promo/create': { req: AdminPromoCreateRequest; res: EmptyResponse };
	'admin/queue/clear': { req: EmptyRequest; res: EmptyResponse };
	'admin/queue/deliver-delayed': { req: EmptyRequest; res: AdminQueueDeliverDelayedResponse };
	'admin/queue/inbox-delayed': { req: EmptyRequest; res: AdminQueueInboxDelayedResponse };
	'admin/queue/promote': { req: AdminQueuePromoteRequest; res: EmptyResponse };
	'admin/queue/stats': { req: EmptyRequest; res: AdminQueueStatsResponse };
	'admin/relays/add': { req: AdminRelaysAddRequest; res: AdminRelaysAddResponse };
	'admin/relays/list': { req: EmptyRequest; res: AdminRelaysListResponse };
	'admin/relays/remove': { req: AdminRelaysRemoveRequest; res: EmptyResponse };
	'admin/reset-password': { req: AdminResetPasswordRequest; res: AdminResetPasswordResponse };
	'admin/resolve-abuse-user-report': { req: AdminResolveAbuseUserReportRequest; res: EmptyResponse };
	'admin/send-email': { req: AdminSendEmailRequest; res: EmptyResponse };
	'admin/server-info': { req: EmptyRequest; res: AdminServerInfoResponse };
	'admin/show-moderation-logs': { req: AdminShowModerationLogsRequest; res: AdminShowModerationLogsResponse };
	'admin/show-user': { req: AdminShowUserRequest; res: AdminShowUserResponse };
	'admin/show-users': { req: AdminShowUsersRequest; res: AdminShowUsersResponse };
	'admin/suspend-user': { req: AdminSuspendUserRequest; res: EmptyResponse };
	'admin/unsuspend-user': { req: AdminUnsuspendUserRequest; res: EmptyResponse };
	'admin/update-meta': { req: AdminUpdateMetaRequest; res: EmptyResponse };
	'admin/delete-account': { req: AdminDeleteAccountRequest; res: EmptyResponse };
	'admin/update-user-note': { req: AdminUpdateUserNoteRequest; res: EmptyResponse };
	'admin/roles/create': { req: AdminRolesCreateRequest; res: AdminRolesCreateResponse };
	'admin/roles/delete': { req: AdminRolesDeleteRequest; res: EmptyResponse };
	'admin/roles/list': { req: EmptyRequest; res: AdminRolesListResponse };
	'admin/roles/show': { req: AdminRolesShowRequest; res: AdminRolesShowResponse };
	'admin/roles/update': { req: AdminRolesUpdateRequest; res: EmptyResponse };
	'admin/roles/assign': { req: AdminRolesAssignRequest; res: EmptyResponse };
	'admin/roles/unassign': { req: AdminRolesUnassignRequest; res: EmptyResponse };
	'admin/roles/update-default-policies': { req: AdminRolesUpdateDefaultPoliciesRequest; res: EmptyResponse };
	'admin/roles/users': { req: AdminRolesUsersRequest; res: AdminRolesUsersResponse };
	'admin/system-webhook/create': { req: AdminSystemWebhookCreateRequest; res: AdminSystemWebhookCreateResponse };
	'admin/system-webhook/delete': { req: AdminSystemWebhookDeleteRequest; res: EmptyResponse };
	'admin/system-webhook/list': { req: AdminSystemWebhookListRequest; res: AdminSystemWebhookListResponse };
	'admin/system-webhook/show': { req: AdminSystemWebhookShowRequest; res: AdminSystemWebhookShowResponse };
	'admin/system-webhook/update': { req: AdminSystemWebhookUpdateRequest; res: AdminSystemWebhookUpdateResponse };
	'announcements': { req: AnnouncementsRequest; res: AnnouncementsResponse };
	'announcements/show': { req: AnnouncementsShowRequest; res: AnnouncementsShowResponse };
	'antennas/create': { req: AntennasCreateRequest; res: AntennasCreateResponse };
	'antennas/delete': { req: AntennasDeleteRequest; res: EmptyResponse };
	'antennas/list': { req: EmptyRequest; res: AntennasListResponse };
	'antennas/notes': { req: AntennasNotesRequest; res: AntennasNotesResponse };
	'antennas/show': { req: AntennasShowRequest; res: AntennasShowResponse };
	'antennas/update': { req: AntennasUpdateRequest; res: AntennasUpdateResponse };
	'ap/get': { req: ApGetRequest; res: ApGetResponse };
	'ap/show': { req: ApShowRequest; res: ApShowResponse };
	'app/create': { req: AppCreateRequest; res: AppCreateResponse };
	'app/show': { req: AppShowRequest; res: AppShowResponse };
	'auth/accept': { req: AuthAcceptRequest; res: EmptyResponse };
	'auth/session/generate': { req: AuthSessionGenerateRequest; res: AuthSessionGenerateResponse };
	'auth/session/show': { req: AuthSessionShowRequest; res: AuthSessionShowResponse };
	'auth/session/userkey': { req: AuthSessionUserkeyRequest; res: AuthSessionUserkeyResponse };
	'blocking/create': { req: BlockingCreateRequest; res: BlockingCreateResponse };
	'blocking/delete': { req: BlockingDeleteRequest; res: BlockingDeleteResponse };
	'blocking/list': { req: BlockingListRequest; res: BlockingListResponse };
	'channels/create': { req: ChannelsCreateRequest; res: ChannelsCreateResponse };
	'channels/featured': { req: EmptyRequest; res: ChannelsFeaturedResponse };
	'channels/follow': { req: ChannelsFollowRequest; res: EmptyResponse };
	'channels/followed': { req: ChannelsFollowedRequest; res: ChannelsFollowedResponse };
	'channels/owned': { req: ChannelsOwnedRequest; res: ChannelsOwnedResponse };
	'channels/show': { req: ChannelsShowRequest; res: ChannelsShowResponse };
	'channels/timeline': { req: ChannelsTimelineRequest; res: ChannelsTimelineResponse };
	'channels/unfollow': { req: ChannelsUnfollowRequest; res: EmptyResponse };
	'channels/update': { req: ChannelsUpdateRequest; res: ChannelsUpdateResponse };
	'channels/favorite': { req: ChannelsFavoriteRequest; res: EmptyResponse };
	'channels/unfavorite': { req: ChannelsUnfavoriteRequest; res: EmptyResponse };
	'channels/my-favorites': { req: EmptyRequest; res: ChannelsMyFavoritesResponse };
	'channels/search': { req: ChannelsSearchRequest; res: ChannelsSearchResponse };
	'charts/active-users': { req: ChartsActiveUsersRequest; res: ChartsActiveUsersResponse };
	'charts/ap-request': { req: ChartsApRequestRequest; res: ChartsApRequestResponse };
	'charts/drive': { req: ChartsDriveRequest; res: ChartsDriveResponse };
	'charts/federation': { req: ChartsFederationRequest; res: ChartsFederationResponse };
	'charts/instance': { req: ChartsInstanceRequest; res: ChartsInstanceResponse };
	'charts/notes': { req: ChartsNotesRequest; res: ChartsNotesResponse };
	'charts/user/drive': { req: ChartsUserDriveRequest; res: ChartsUserDriveResponse };
	'charts/user/following': { req: ChartsUserFollowingRequest; res: ChartsUserFollowingResponse };
	'charts/user/notes': { req: ChartsUserNotesRequest; res: ChartsUserNotesResponse };
	'charts/user/pv': { req: ChartsUserPvRequest; res: ChartsUserPvResponse };
	'charts/user/reactions': { req: ChartsUserReactionsRequest; res: ChartsUserReactionsResponse };
	'charts/users': { req: ChartsUsersRequest; res: ChartsUsersResponse };
	'clips/add-note': { req: ClipsAddNoteRequest; res: EmptyResponse };
	'clips/remove-note': { req: ClipsRemoveNoteRequest; res: EmptyResponse };
	'clips/create': { req: ClipsCreateRequest; res: ClipsCreateResponse };
	'clips/delete': { req: ClipsDeleteRequest; res: EmptyResponse };
	'clips/list': { req: EmptyRequest; res: ClipsListResponse };
	'clips/notes': { req: ClipsNotesRequest; res: ClipsNotesResponse };
	'clips/show': { req: ClipsShowRequest; res: ClipsShowResponse };
	'clips/update': { req: ClipsUpdateRequest; res: ClipsUpdateResponse };
	'clips/favorite': { req: ClipsFavoriteRequest; res: EmptyResponse };
	'clips/unfavorite': { req: ClipsUnfavoriteRequest; res: EmptyResponse };
	'clips/my-favorites': { req: EmptyRequest; res: ClipsMyFavoritesResponse };
	'drive': { req: EmptyRequest; res: DriveResponse };
	'drive/files': { req: DriveFilesRequest; res: DriveFilesResponse };
	'drive/files/attached-notes': { req: DriveFilesAttachedNotesRequest; res: DriveFilesAttachedNotesResponse };
	'drive/files/check-existence': { req: DriveFilesCheckExistenceRequest; res: DriveFilesCheckExistenceResponse };
	'drive/files/create': { req: DriveFilesCreateRequest; res: DriveFilesCreateResponse };
	'drive/files/delete': { req: DriveFilesDeleteRequest; res: EmptyResponse };
	'drive/files/find-by-hash': { req: DriveFilesFindByHashRequest; res: DriveFilesFindByHashResponse };
	'drive/files/find': { req: DriveFilesFindRequest; res: DriveFilesFindResponse };
	'drive/files/show': { req: DriveFilesShowRequest; res: DriveFilesShowResponse };
	'drive/files/update': { req: DriveFilesUpdateRequest; res: DriveFilesUpdateResponse };
	'drive/files/upload-from-url': { req: DriveFilesUploadFromUrlRequest; res: EmptyResponse };
	'drive/folders': { req: DriveFoldersRequest; res: DriveFoldersResponse };
	'drive/folders/create': { req: DriveFoldersCreateRequest; res: DriveFoldersCreateResponse };
	'drive/folders/delete': { req: DriveFoldersDeleteRequest; res: EmptyResponse };
	'drive/folders/find': { req: DriveFoldersFindRequest; res: DriveFoldersFindResponse };
	'drive/folders/show': { req: DriveFoldersShowRequest; res: DriveFoldersShowResponse };
	'drive/folders/update': { req: DriveFoldersUpdateRequest; res: DriveFoldersUpdateResponse };
	'drive/stream': { req: DriveStreamRequest; res: DriveStreamResponse };
	'email-address/available': { req: EmailAddressAvailableRequest; res: EmailAddressAvailableResponse };
	'endpoint': { req: EndpointRequest; res: EndpointResponse };
	'endpoints': { req: EmptyRequest; res: EndpointsResponse };
	'export-custom-emojis': { req: EmptyRequest; res: EmptyResponse };
	'federation/followers': { req: FederationFollowersRequest; res: FederationFollowersResponse };
	'federation/following': { req: FederationFollowingRequest; res: FederationFollowingResponse };
	'federation/instances': { req: FederationInstancesRequest; res: FederationInstancesResponse };
	'federation/show-instance': { req: FederationShowInstanceRequest; res: FederationShowInstanceResponse };
	'federation/update-remote-user': { req: FederationUpdateRemoteUserRequest; res: EmptyResponse };
	'federation/users': { req: FederationUsersRequest; res: FederationUsersResponse };
	'federation/stats': { req: FederationStatsRequest; res: FederationStatsResponse };
	'following/create': { req: FollowingCreateRequest; res: FollowingCreateResponse };
	'following/delete': { req: FollowingDeleteRequest; res: FollowingDeleteResponse };
	'following/update': { req: FollowingUpdateRequest; res: FollowingUpdateResponse };
	'following/update-all': { req: FollowingUpdateAllRequest; res: EmptyResponse };
	'following/invalidate': { req: FollowingInvalidateRequest; res: FollowingInvalidateResponse };
	'following/requests/accept': { req: FollowingRequestsAcceptRequest; res: EmptyResponse };
	'following/requests/cancel': { req: FollowingRequestsCancelRequest; res: FollowingRequestsCancelResponse };
	'following/requests/list': { req: FollowingRequestsListRequest; res: FollowingRequestsListResponse };
	'following/requests/reject': { req: FollowingRequestsRejectRequest; res: EmptyResponse };
	'gallery/featured': { req: GalleryFeaturedRequest; res: GalleryFeaturedResponse };
	'gallery/popular': { req: EmptyRequest; res: GalleryPopularResponse };
	'gallery/posts': { req: GalleryPostsRequest; res: GalleryPostsResponse };
	'gallery/posts/create': { req: GalleryPostsCreateRequest; res: GalleryPostsCreateResponse };
	'gallery/posts/delete': { req: GalleryPostsDeleteRequest; res: EmptyResponse };
	'gallery/posts/like': { req: GalleryPostsLikeRequest; res: EmptyResponse };
	'gallery/posts/show': { req: GalleryPostsShowRequest; res: GalleryPostsShowResponse };
	'gallery/posts/unlike': { req: GalleryPostsUnlikeRequest; res: EmptyResponse };
	'gallery/posts/update': { req: GalleryPostsUpdateRequest; res: GalleryPostsUpdateResponse };
	'get-online-users-count': { req: EmptyRequest; res: GetOnlineUsersCountResponse };
	'get-avatar-decorations': { req: EmptyRequest; res: GetAvatarDecorationsResponse };
	'hashtags/list': { req: HashtagsListRequest; res: HashtagsListResponse };
	'hashtags/search': { req: HashtagsSearchRequest; res: HashtagsSearchResponse };
	'hashtags/show': { req: HashtagsShowRequest; res: HashtagsShowResponse };
	'hashtags/trend': { req: EmptyRequest; res: HashtagsTrendResponse };
	'hashtags/users': { req: HashtagsUsersRequest; res: HashtagsUsersResponse };
	'i': { req: EmptyRequest; res: IResponse };
	'i/2fa/done': { req: I2faDoneRequest; res: I2faDoneResponse };
	'i/2fa/key-done': { req: I2faKeyDoneRequest; res: I2faKeyDoneResponse };
	'i/2fa/password-less': { req: I2faPasswordLessRequest; res: EmptyResponse };
	'i/2fa/register-key': { req: I2faRegisterKeyRequest; res: I2faRegisterKeyResponse };
	'i/2fa/register': { req: I2faRegisterRequest; res: I2faRegisterResponse };
	'i/2fa/update-key': { req: I2faUpdateKeyRequest; res: EmptyResponse };
	'i/2fa/remove-key': { req: I2faRemoveKeyRequest; res: EmptyResponse };
	'i/2fa/unregister': { req: I2faUnregisterRequest; res: EmptyResponse };
	'i/apps': { req: IAppsRequest; res: IAppsResponse };
	'i/authorized-apps': { req: IAuthorizedAppsRequest; res: IAuthorizedAppsResponse };
	'i/claim-achievement': { req: IClaimAchievementRequest; res: EmptyResponse };
	'i/change-password': { req: IChangePasswordRequest; res: EmptyResponse };
	'i/delete-account': { req: IDeleteAccountRequest; res: EmptyResponse };
	'i/export-blocking': { req: EmptyRequest; res: EmptyResponse };
	'i/export-following': { req: IExportFollowingRequest; res: EmptyResponse };
	'i/export-mute': { req: EmptyRequest; res: EmptyResponse };
	'i/export-notes': { req: EmptyRequest; res: EmptyResponse };
	'i/export-clips': { req: EmptyRequest; res: EmptyResponse };
	'i/export-favorites': { req: EmptyRequest; res: EmptyResponse };
	'i/export-user-lists': { req: EmptyRequest; res: EmptyResponse };
	'i/export-antennas': { req: EmptyRequest; res: EmptyResponse };
	'i/favorites': { req: IFavoritesRequest; res: IFavoritesResponse };
	'i/gallery/likes': { req: IGalleryLikesRequest; res: IGalleryLikesResponse };
	'i/gallery/posts': { req: IGalleryPostsRequest; res: IGalleryPostsResponse };
	'i/import-blocking': { req: IImportBlockingRequest; res: EmptyResponse };
	'i/import-following': { req: IImportFollowingRequest; res: EmptyResponse };
	'i/import-muting': { req: IImportMutingRequest; res: EmptyResponse };
	'i/import-user-lists': { req: IImportUserListsRequest; res: EmptyResponse };
	'i/import-antennas': { req: IImportAntennasRequest; res: EmptyResponse };
	'i/notifications': { req: INotificationsRequest; res: INotificationsResponse };
	'i/notifications-grouped': { req: INotificationsGroupedRequest; res: INotificationsGroupedResponse };
	'i/page-likes': { req: IPageLikesRequest; res: IPageLikesResponse };
	'i/pages': { req: IPagesRequest; res: IPagesResponse };
	'i/pin': { req: IPinRequest; res: IPinResponse };
	'i/read-all-unread-notes': { req: EmptyRequest; res: EmptyResponse };
	'i/read-announcement': { req: IReadAnnouncementRequest; res: EmptyResponse };
	'i/regenerate-token': { req: IRegenerateTokenRequest; res: EmptyResponse };
	'i/registry/get-all': { req: IRegistryGetAllRequest; res: IRegistryGetAllResponse };
	'i/registry/get-detail': { req: IRegistryGetDetailRequest; res: IRegistryGetDetailResponse };
	'i/registry/get': { req: IRegistryGetRequest; res: IRegistryGetResponse };
	'i/registry/keys-with-type': { req: IRegistryKeysWithTypeRequest; res: IRegistryKeysWithTypeResponse };
	'i/registry/keys': { req: IRegistryKeysRequest; res: IRegistryKeysResponse };
	'i/registry/remove': { req: IRegistryRemoveRequest; res: EmptyResponse };
	'i/registry/scopes-with-domain': { req: EmptyRequest; res: IRegistryScopesWithDomainResponse };
	'i/registry/set': { req: IRegistrySetRequest; res: EmptyResponse };
	'i/revoke-token': { req: IRevokeTokenRequest; res: EmptyResponse };
	'i/signin-history': { req: ISigninHistoryRequest; res: ISigninHistoryResponse };
	'i/unpin': { req: IUnpinRequest; res: IUnpinResponse };
	'i/update-email': { req: IUpdateEmailRequest; res: IUpdateEmailResponse };
	'i/update': { req: IUpdateRequest; res: IUpdateResponse };
	'i/move': { req: IMoveRequest; res: IMoveResponse };
	'i/webhooks/create': { req: IWebhooksCreateRequest; res: IWebhooksCreateResponse };
	'i/webhooks/list': { req: EmptyRequest; res: IWebhooksListResponse };
	'i/webhooks/show': { req: IWebhooksShowRequest; res: IWebhooksShowResponse };
	'i/webhooks/update': { req: IWebhooksUpdateRequest; res: EmptyResponse };
	'i/webhooks/delete': { req: IWebhooksDeleteRequest; res: EmptyResponse };
	'invite/create': { req: EmptyRequest; res: InviteCreateResponse };
	'invite/delete': { req: InviteDeleteRequest; res: EmptyResponse };
	'invite/list': { req: InviteListRequest; res: InviteListResponse };
	'invite/limit': { req: EmptyRequest; res: InviteLimitResponse };
	'meta': { req: MetaRequest; res: MetaResponse };
	'emojis': { req: EmptyRequest; res: EmojisResponse };
	'emoji': { req: EmojiRequest; res: EmojiResponse };
	'miauth/gen-token': { req: MiauthGenTokenRequest; res: MiauthGenTokenResponse };
	'mute/create': { req: MuteCreateRequest; res: EmptyResponse };
	'mute/delete': { req: MuteDeleteRequest; res: EmptyResponse };
	'mute/list': { req: MuteListRequest; res: MuteListResponse };
	'renote-mute/create': { req: RenoteMuteCreateRequest; res: EmptyResponse };
	'renote-mute/delete': { req: RenoteMuteDeleteRequest; res: EmptyResponse };
	'renote-mute/list': { req: RenoteMuteListRequest; res: RenoteMuteListResponse };
	'my/apps': { req: MyAppsRequest; res: MyAppsResponse };
	'notes': { req: NotesRequest; res: NotesResponse };
	'notes/children': { req: NotesChildrenRequest; res: NotesChildrenResponse };
	'notes/clips': { req: NotesClipsRequest; res: NotesClipsResponse };
	'notes/conversation': { req: NotesConversationRequest; res: NotesConversationResponse };
	'notes/create': { req: NotesCreateRequest; res: NotesCreateResponse };
	'notes/delete': { req: NotesDeleteRequest; res: EmptyResponse };
	'notes/favorites/create': { req: NotesFavoritesCreateRequest; res: EmptyResponse };
	'notes/favorites/delete': { req: NotesFavoritesDeleteRequest; res: EmptyResponse };
	'notes/featured': { req: NotesFeaturedRequest; res: NotesFeaturedResponse };
	'notes/global-timeline': { req: NotesGlobalTimelineRequest; res: NotesGlobalTimelineResponse };
	'notes/hybrid-timeline': { req: NotesHybridTimelineRequest; res: NotesHybridTimelineResponse };
	'notes/local-timeline': { req: NotesLocalTimelineRequest; res: NotesLocalTimelineResponse };
	'notes/mentions': { req: NotesMentionsRequest; res: NotesMentionsResponse };
	'notes/polls/recommendation': { req: NotesPollsRecommendationRequest; res: NotesPollsRecommendationResponse };
	'notes/polls/vote': { req: NotesPollsVoteRequest; res: EmptyResponse };
	'notes/reactions': { req: NotesReactionsRequest; res: NotesReactionsResponse };
	'notes/reactions/create': { req: NotesReactionsCreateRequest; res: EmptyResponse };
	'notes/reactions/delete': { req: NotesReactionsDeleteRequest; res: EmptyResponse };
	'notes/renotes': { req: NotesRenotesRequest; res: NotesRenotesResponse };
	'notes/replies': { req: NotesRepliesRequest; res: NotesRepliesResponse };
	'notes/search-by-tag': { req: NotesSearchByTagRequest; res: NotesSearchByTagResponse };
	'notes/search': { req: NotesSearchRequest; res: NotesSearchResponse };
	'notes/show': { req: NotesShowRequest; res: NotesShowResponse };
	'notes/state': { req: NotesStateRequest; res: NotesStateResponse };
	'notes/thread-muting/create': { req: NotesThreadMutingCreateRequest; res: EmptyResponse };
	'notes/thread-muting/delete': { req: NotesThreadMutingDeleteRequest; res: EmptyResponse };
	'notes/timeline': { req: NotesTimelineRequest; res: NotesTimelineResponse };
	'notes/translate': { req: NotesTranslateRequest; res: NotesTranslateResponse };
	'notes/unrenote': { req: NotesUnrenoteRequest; res: EmptyResponse };
	'notes/user-list-timeline': { req: NotesUserListTimelineRequest; res: NotesUserListTimelineResponse };
	'notifications/create': { req: NotificationsCreateRequest; res: EmptyResponse };
	'notifications/flush': { req: EmptyRequest; res: EmptyResponse };
	'notifications/mark-all-as-read': { req: EmptyRequest; res: EmptyResponse };
	'notifications/test-notification': { req: EmptyRequest; res: EmptyResponse };
	'page-push': { req: PagePushRequest; res: EmptyResponse };
	'pages/create': { req: PagesCreateRequest; res: PagesCreateResponse };
	'pages/delete': { req: PagesDeleteRequest; res: EmptyResponse };
	'pages/featured': { req: EmptyRequest; res: PagesFeaturedResponse };
	'pages/like': { req: PagesLikeRequest; res: EmptyResponse };
	'pages/show': { req: PagesShowRequest; res: PagesShowResponse };
	'pages/unlike': { req: PagesUnlikeRequest; res: EmptyResponse };
	'pages/update': { req: PagesUpdateRequest; res: EmptyResponse };
	'flash/create': { req: FlashCreateRequest; res: FlashCreateResponse };
	'flash/delete': { req: FlashDeleteRequest; res: EmptyResponse };
	'flash/featured': { req: EmptyRequest; res: FlashFeaturedResponse };
	'flash/like': { req: FlashLikeRequest; res: EmptyResponse };
	'flash/show': { req: FlashShowRequest; res: FlashShowResponse };
	'flash/unlike': { req: FlashUnlikeRequest; res: EmptyResponse };
	'flash/update': { req: FlashUpdateRequest; res: EmptyResponse };
	'flash/my': { req: FlashMyRequest; res: FlashMyResponse };
	'flash/my-likes': { req: FlashMyLikesRequest; res: FlashMyLikesResponse };
	'ping': { req: EmptyRequest; res: PingResponse };
	'pinned-users': { req: EmptyRequest; res: PinnedUsersResponse };
	'promo/read': { req: PromoReadRequest; res: EmptyResponse };
	'roles/list': { req: EmptyRequest; res: RolesListResponse };
	'roles/show': { req: RolesShowRequest; res: RolesShowResponse };
	'roles/users': { req: RolesUsersRequest; res: RolesUsersResponse };
	'roles/notes': { req: RolesNotesRequest; res: RolesNotesResponse };
	'request-reset-password': { req: RequestResetPasswordRequest; res: EmptyResponse };
	'reset-db': { req: EmptyRequest; res: EmptyResponse };
	'reset-password': { req: ResetPasswordRequest; res: EmptyResponse };
	'server-info': { req: EmptyRequest; res: ServerInfoResponse };
	'stats': { req: EmptyRequest; res: StatsResponse };
	'sw/show-registration': { req: SwShowRegistrationRequest; res: SwShowRegistrationResponse };
	'sw/update-registration': { req: SwUpdateRegistrationRequest; res: SwUpdateRegistrationResponse };
	'sw/register': { req: SwRegisterRequest; res: SwRegisterResponse };
	'sw/unregister': { req: SwUnregisterRequest; res: EmptyResponse };
	'test': { req: TestRequest; res: TestResponse };
	'username/available': { req: UsernameAvailableRequest; res: UsernameAvailableResponse };
	'users': { req: UsersRequest; res: UsersResponse };
	'users/clips': { req: UsersClipsRequest; res: UsersClipsResponse };
	'users/followers': { req: UsersFollowersRequest; res: UsersFollowersResponse };
	'users/following': { req: UsersFollowingRequest; res: UsersFollowingResponse };
	'users/gallery/posts': { req: UsersGalleryPostsRequest; res: UsersGalleryPostsResponse };
	'users/get-frequently-replied-users': { req: UsersGetFrequentlyRepliedUsersRequest; res: UsersGetFrequentlyRepliedUsersResponse };
	'users/featured-notes': { req: UsersFeaturedNotesRequest; res: UsersFeaturedNotesResponse };
	'users/lists/create': { req: UsersListsCreateRequest; res: UsersListsCreateResponse };
	'users/lists/delete': { req: UsersListsDeleteRequest; res: EmptyResponse };
	'users/lists/list': { req: UsersListsListRequest; res: UsersListsListResponse };
	'users/lists/pull': { req: UsersListsPullRequest; res: EmptyResponse };
	'users/lists/push': { req: UsersListsPushRequest; res: EmptyResponse };
	'users/lists/show': { req: UsersListsShowRequest; res: UsersListsShowResponse };
	'users/lists/favorite': { req: UsersListsFavoriteRequest; res: EmptyResponse };
	'users/lists/unfavorite': { req: UsersListsUnfavoriteRequest; res: EmptyResponse };
	'users/lists/update': { req: UsersListsUpdateRequest; res: UsersListsUpdateResponse };
	'users/lists/create-from-public': { req: UsersListsCreateFromPublicRequest; res: UsersListsCreateFromPublicResponse };
	'users/lists/update-membership': { req: UsersListsUpdateMembershipRequest; res: EmptyResponse };
	'users/lists/get-memberships': { req: UsersListsGetMembershipsRequest; res: UsersListsGetMembershipsResponse };
	'users/notes': { req: UsersNotesRequest; res: UsersNotesResponse };
	'users/pages': { req: UsersPagesRequest; res: UsersPagesResponse };
	'users/flashs': { req: UsersFlashsRequest; res: UsersFlashsResponse };
	'users/reactions': { req: UsersReactionsRequest; res: UsersReactionsResponse };
	'users/recommendation': { req: UsersRecommendationRequest; res: UsersRecommendationResponse };
	'users/relation': { req: UsersRelationRequest; res: UsersRelationResponse };
	'users/report-abuse': { req: UsersReportAbuseRequest; res: EmptyResponse };
	'users/search-by-username-and-host': { req: UsersSearchByUsernameAndHostRequest; res: UsersSearchByUsernameAndHostResponse };
	'users/search': { req: UsersSearchRequest; res: UsersSearchResponse };
	'users/show': { req: UsersShowRequest; res: UsersShowResponse };
	'users/achievements': { req: UsersAchievementsRequest; res: UsersAchievementsResponse };
	'users/update-memo': { req: UsersUpdateMemoRequest; res: EmptyResponse };
	'fetch-rss': { req: FetchRssRequest; res: FetchRssResponse };
	'fetch-external-resources': { req: FetchExternalResourcesRequest; res: FetchExternalResourcesResponse };
	'retention': { req: EmptyRequest; res: RetentionResponse };
	'bubble-game/register': { req: BubbleGameRegisterRequest; res: EmptyResponse };
	'bubble-game/ranking': { req: BubbleGameRankingRequest; res: BubbleGameRankingResponse };
	'reversi/cancel-match': { req: ReversiCancelMatchRequest; res: EmptyResponse };
	'reversi/games': { req: ReversiGamesRequest; res: ReversiGamesResponse };
	'reversi/match': { req: ReversiMatchRequest; res: ReversiMatchResponse };
	'reversi/invitations': { req: EmptyRequest; res: ReversiInvitationsResponse };
	'reversi/show-game': { req: ReversiShowGameRequest; res: ReversiShowGameResponse };
	'reversi/surrender': { req: ReversiSurrenderRequest; res: EmptyResponse };
	'reversi/verify': { req: ReversiVerifyRequest; res: ReversiVerifyResponse };
}

export const endpointReqTypes: Record<keyof Endpoints, 'application/json' | 'multipart/form-data'> = {
	'admin/meta': 'application/json',
	'admin/abuse-user-reports': 'application/json',
	'admin/abuse-report/notification-recipient/list': 'application/json',
	'admin/abuse-report/notification-recipient/show': 'application/json',
	'admin/abuse-report/notification-recipient/create': 'application/json',
	'admin/abuse-report/notification-recipient/update': 'application/json',
	'admin/abuse-report/notification-recipient/delete': 'application/json',
	'admin/accounts/create': 'application/json',
	'admin/accounts/delete': 'application/json',
	'admin/accounts/find-by-email': 'application/json',
	'admin/ad/create': 'application/json',
	'admin/ad/delete': 'application/json',
	'admin/ad/list': 'application/json',
	'admin/ad/update': 'application/json',
	'admin/announcements/create': 'application/json',
	'admin/announcements/delete': 'application/json',
	'admin/announcements/list': 'application/json',
	'admin/announcements/update': 'application/json',
	'admin/avatar-decorations/create': 'application/json',
	'admin/avatar-decorations/delete': 'application/json',
	'admin/avatar-decorations/list': 'application/json',
	'admin/avatar-decorations/update': 'application/json',
	'admin/delete-all-files-of-a-user': 'application/json',
	'admin/unset-user-avatar': 'application/json',
	'admin/unset-user-banner': 'application/json',
	'admin/drive/clean-remote-files': 'application/json',
	'admin/drive/cleanup': 'application/json',
	'admin/drive/files': 'application/json',
	'admin/drive/show-file': 'application/json',
	'admin/emoji/add-aliases-bulk': 'application/json',
	'admin/emoji/add': 'application/json',
	'admin/emoji/copy': 'application/json',
	'admin/emoji/delete-bulk': 'application/json',
	'admin/emoji/delete': 'application/json',
	'admin/emoji/import-zip': 'application/json',
	'admin/emoji/list-remote': 'application/json',
	'admin/emoji/list': 'application/json',
	'admin/emoji/remove-aliases-bulk': 'application/json',
	'admin/emoji/set-aliases-bulk': 'application/json',
	'admin/emoji/set-category-bulk': 'application/json',
	'admin/emoji/set-license-bulk': 'application/json',
	'admin/emoji/update': 'application/json',
	'admin/federation/delete-all-files': 'application/json',
	'admin/federation/refresh-remote-instance-metadata': 'application/json',
	'admin/federation/remove-all-following': 'application/json',
	'admin/federation/update-instance': 'application/json',
	'admin/get-index-stats': 'application/json',
	'admin/get-table-stats': 'application/json',
	'admin/get-user-ips': 'application/json',
	'admin/invite/create': 'application/json',
	'admin/invite/list': 'application/json',
	'admin/promo/create': 'application/json',
	'admin/queue/clear': 'application/json',
	'admin/queue/deliver-delayed': 'application/json',
	'admin/queue/inbox-delayed': 'application/json',
	'admin/queue/promote': 'application/json',
	'admin/queue/stats': 'application/json',
	'admin/relays/add': 'application/json',
	'admin/relays/list': 'application/json',
	'admin/relays/remove': 'application/json',
	'admin/reset-password': 'application/json',
	'admin/resolve-abuse-user-report': 'application/json',
	'admin/send-email': 'application/json',
	'admin/server-info': 'application/json',
	'admin/show-moderation-logs': 'application/json',
	'admin/show-user': 'application/json',
	'admin/show-users': 'application/json',
	'admin/suspend-user': 'application/json',
	'admin/unsuspend-user': 'application/json',
	'admin/update-meta': 'application/json',
	'admin/delete-account': 'application/json',
	'admin/update-user-note': 'application/json',
	'admin/roles/create': 'application/json',
	'admin/roles/delete': 'application/json',
	'admin/roles/list': 'application/json',
	'admin/roles/show': 'application/json',
	'admin/roles/update': 'application/json',
	'admin/roles/assign': 'application/json',
	'admin/roles/unassign': 'application/json',
	'admin/roles/update-default-policies': 'application/json',
	'admin/roles/users': 'application/json',
	'admin/system-webhook/create': 'application/json',
	'admin/system-webhook/delete': 'application/json',
	'admin/system-webhook/list': 'application/json',
	'admin/system-webhook/show': 'application/json',
	'admin/system-webhook/update': 'application/json',
	'announcements': 'application/json',
	'announcements/show': 'application/json',
	'antennas/create': 'application/json',
	'antennas/delete': 'application/json',
	'antennas/list': 'application/json',
	'antennas/notes': 'application/json',
	'antennas/show': 'application/json',
	'antennas/update': 'application/json',
	'ap/get': 'application/json',
	'ap/show': 'application/json',
	'app/create': 'application/json',
	'app/show': 'application/json',
	'auth/accept': 'application/json',
	'auth/session/generate': 'application/json',
	'auth/session/show': 'application/json',
	'auth/session/userkey': 'application/json',
	'blocking/create': 'application/json',
	'blocking/delete': 'application/json',
	'blocking/list': 'application/json',
	'channels/create': 'application/json',
	'channels/featured': 'application/json',
	'channels/follow': 'application/json',
	'channels/followed': 'application/json',
	'channels/owned': 'application/json',
	'channels/show': 'application/json',
	'channels/timeline': 'application/json',
	'channels/unfollow': 'application/json',
	'channels/update': 'application/json',
	'channels/favorite': 'application/json',
	'channels/unfavorite': 'application/json',
	'channels/my-favorites': 'application/json',
	'channels/search': 'application/json',
	'charts/active-users': 'application/json',
	'charts/ap-request': 'application/json',
	'charts/drive': 'application/json',
	'charts/federation': 'application/json',
	'charts/instance': 'application/json',
	'charts/notes': 'application/json',
	'charts/user/drive': 'application/json',
	'charts/user/following': 'application/json',
	'charts/user/notes': 'application/json',
	'charts/user/pv': 'application/json',
	'charts/user/reactions': 'application/json',
	'charts/users': 'application/json',
	'clips/add-note': 'application/json',
	'clips/remove-note': 'application/json',
	'clips/create': 'application/json',
	'clips/delete': 'application/json',
	'clips/list': 'application/json',
	'clips/notes': 'application/json',
	'clips/show': 'application/json',
	'clips/update': 'application/json',
	'clips/favorite': 'application/json',
	'clips/unfavorite': 'application/json',
	'clips/my-favorites': 'application/json',
	'drive': 'application/json',
	'drive/files': 'application/json',
	'drive/files/attached-notes': 'application/json',
	'drive/files/check-existence': 'application/json',
	'drive/files/create': 'multipart/form-data',
	'drive/files/delete': 'application/json',
	'drive/files/find-by-hash': 'application/json',
	'drive/files/find': 'application/json',
	'drive/files/show': 'application/json',
	'drive/files/update': 'application/json',
	'drive/files/upload-from-url': 'application/json',
	'drive/folders': 'application/json',
	'drive/folders/create': 'application/json',
	'drive/folders/delete': 'application/json',
	'drive/folders/find': 'application/json',
	'drive/folders/show': 'application/json',
	'drive/folders/update': 'application/json',
	'drive/stream': 'application/json',
	'email-address/available': 'application/json',
	'endpoint': 'application/json',
	'endpoints': 'application/json',
	'export-custom-emojis': 'application/json',
	'federation/followers': 'application/json',
	'federation/following': 'application/json',
	'federation/instances': 'application/json',
	'federation/show-instance': 'application/json',
	'federation/update-remote-user': 'application/json',
	'federation/users': 'application/json',
	'federation/stats': 'application/json',
	'following/create': 'application/json',
	'following/delete': 'application/json',
	'following/update': 'application/json',
	'following/update-all': 'application/json',
	'following/invalidate': 'application/json',
	'following/requests/accept': 'application/json',
	'following/requests/cancel': 'application/json',
	'following/requests/list': 'application/json',
	'following/requests/reject': 'application/json',
	'gallery/featured': 'application/json',
	'gallery/popular': 'application/json',
	'gallery/posts': 'application/json',
	'gallery/posts/create': 'application/json',
	'gallery/posts/delete': 'application/json',
	'gallery/posts/like': 'application/json',
	'gallery/posts/show': 'application/json',
	'gallery/posts/unlike': 'application/json',
	'gallery/posts/update': 'application/json',
	'get-online-users-count': 'application/json',
	'get-avatar-decorations': 'application/json',
	'hashtags/list': 'application/json',
	'hashtags/search': 'application/json',
	'hashtags/show': 'application/json',
	'hashtags/trend': 'application/json',
	'hashtags/users': 'application/json',
	'i': 'application/json',
	'i/2fa/done': 'application/json',
	'i/2fa/key-done': 'application/json',
	'i/2fa/password-less': 'application/json',
	'i/2fa/register-key': 'application/json',
	'i/2fa/register': 'application/json',
	'i/2fa/update-key': 'application/json',
	'i/2fa/remove-key': 'application/json',
	'i/2fa/unregister': 'application/json',
	'i/apps': 'application/json',
	'i/authorized-apps': 'application/json',
	'i/claim-achievement': 'application/json',
	'i/change-password': 'application/json',
	'i/delete-account': 'application/json',
	'i/export-blocking': 'application/json',
	'i/export-following': 'application/json',
	'i/export-mute': 'application/json',
	'i/export-notes': 'application/json',
	'i/export-clips': 'application/json',
	'i/export-favorites': 'application/json',
	'i/export-user-lists': 'application/json',
	'i/export-antennas': 'application/json',
	'i/favorites': 'application/json',
	'i/gallery/likes': 'application/json',
	'i/gallery/posts': 'application/json',
	'i/import-blocking': 'application/json',
	'i/import-following': 'application/json',
	'i/import-muting': 'application/json',
	'i/import-user-lists': 'application/json',
	'i/import-antennas': 'application/json',
	'i/notifications': 'application/json',
	'i/notifications-grouped': 'application/json',
	'i/page-likes': 'application/json',
	'i/pages': 'application/json',
	'i/pin': 'application/json',
	'i/read-all-unread-notes': 'application/json',
	'i/read-announcement': 'application/json',
	'i/regenerate-token': 'application/json',
	'i/registry/get-all': 'application/json',
	'i/registry/get-detail': 'application/json',
	'i/registry/get': 'application/json',
	'i/registry/keys-with-type': 'application/json',
	'i/registry/keys': 'application/json',
	'i/registry/remove': 'application/json',
	'i/registry/scopes-with-domain': 'application/json',
	'i/registry/set': 'application/json',
	'i/revoke-token': 'application/json',
	'i/signin-history': 'application/json',
	'i/unpin': 'application/json',
	'i/update-email': 'application/json',
	'i/update': 'application/json',
	'i/move': 'application/json',
	'i/webhooks/create': 'application/json',
	'i/webhooks/list': 'application/json',
	'i/webhooks/show': 'application/json',
	'i/webhooks/update': 'application/json',
	'i/webhooks/delete': 'application/json',
	'invite/create': 'application/json',
	'invite/delete': 'application/json',
	'invite/list': 'application/json',
	'invite/limit': 'application/json',
	'meta': 'application/json',
	'emojis': 'application/json',
	'emoji': 'application/json',
	'miauth/gen-token': 'application/json',
	'mute/create': 'application/json',
	'mute/delete': 'application/json',
	'mute/list': 'application/json',
	'renote-mute/create': 'application/json',
	'renote-mute/delete': 'application/json',
	'renote-mute/list': 'application/json',
	'my/apps': 'application/json',
	'notes': 'application/json',
	'notes/children': 'application/json',
	'notes/clips': 'application/json',
	'notes/conversation': 'application/json',
	'notes/create': 'application/json',
	'notes/delete': 'application/json',
	'notes/favorites/create': 'application/json',
	'notes/favorites/delete': 'application/json',
	'notes/featured': 'application/json',
	'notes/global-timeline': 'application/json',
	'notes/hybrid-timeline': 'application/json',
	'notes/local-timeline': 'application/json',
	'notes/mentions': 'application/json',
	'notes/polls/recommendation': 'application/json',
	'notes/polls/vote': 'application/json',
	'notes/reactions': 'application/json',
	'notes/reactions/create': 'application/json',
	'notes/reactions/delete': 'application/json',
	'notes/renotes': 'application/json',
	'notes/replies': 'application/json',
	'notes/search-by-tag': 'application/json',
	'notes/search': 'application/json',
	'notes/show': 'application/json',
	'notes/state': 'application/json',
	'notes/thread-muting/create': 'application/json',
	'notes/thread-muting/delete': 'application/json',
	'notes/timeline': 'application/json',
	'notes/translate': 'application/json',
	'notes/unrenote': 'application/json',
	'notes/user-list-timeline': 'application/json',
	'notifications/create': 'application/json',
	'notifications/flush': 'application/json',
	'notifications/mark-all-as-read': 'application/json',
	'notifications/test-notification': 'application/json',
	'page-push': 'application/json',
	'pages/create': 'application/json',
	'pages/delete': 'application/json',
	'pages/featured': 'application/json',
	'pages/like': 'application/json',
	'pages/show': 'application/json',
	'pages/unlike': 'application/json',
	'pages/update': 'application/json',
	'flash/create': 'application/json',
	'flash/delete': 'application/json',
	'flash/featured': 'application/json',
	'flash/like': 'application/json',
	'flash/show': 'application/json',
	'flash/unlike': 'application/json',
	'flash/update': 'application/json',
	'flash/my': 'application/json',
	'flash/my-likes': 'application/json',
	'ping': 'application/json',
	'pinned-users': 'application/json',
	'promo/read': 'application/json',
	'roles/list': 'application/json',
	'roles/show': 'application/json',
	'roles/users': 'application/json',
	'roles/notes': 'application/json',
	'request-reset-password': 'application/json',
	'reset-db': 'application/json',
	'reset-password': 'application/json',
	'server-info': 'application/json',
	'stats': 'application/json',
	'sw/show-registration': 'application/json',
	'sw/update-registration': 'application/json',
	'sw/register': 'application/json',
	'sw/unregister': 'application/json',
	'test': 'application/json',
	'username/available': 'application/json',
	'users': 'application/json',
	'users/clips': 'application/json',
	'users/followers': 'application/json',
	'users/following': 'application/json',
	'users/gallery/posts': 'application/json',
	'users/get-frequently-replied-users': 'application/json',
	'users/featured-notes': 'application/json',
	'users/lists/create': 'application/json',
	'users/lists/delete': 'application/json',
	'users/lists/list': 'application/json',
	'users/lists/pull': 'application/json',
	'users/lists/push': 'application/json',
	'users/lists/show': 'application/json',
	'users/lists/favorite': 'application/json',
	'users/lists/unfavorite': 'application/json',
	'users/lists/update': 'application/json',
	'users/lists/create-from-public': 'application/json',
	'users/lists/update-membership': 'application/json',
	'users/lists/get-memberships': 'application/json',
	'users/notes': 'application/json',
	'users/pages': 'application/json',
	'users/flashs': 'application/json',
	'users/reactions': 'application/json',
	'users/recommendation': 'application/json',
	'users/relation': 'application/json',
	'users/report-abuse': 'application/json',
	'users/search-by-username-and-host': 'application/json',
	'users/search': 'application/json',
	'users/show': 'application/json',
	'users/achievements': 'application/json',
	'users/update-memo': 'application/json',
	'fetch-rss': 'application/json',
	'fetch-external-resources': 'application/json',
	'retention': 'application/json',
	'bubble-game/register': 'application/json',
	'bubble-game/ranking': 'application/json',
	'reversi/cancel-match': 'application/json',
	'reversi/games': 'application/json',
	'reversi/match': 'application/json',
	'reversi/invitations': 'application/json',
	'reversi/show-game': 'application/json',
	'reversi/surrender': 'application/json',
	'reversi/verify': 'application/json',
};
