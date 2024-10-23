/* eslint @typescript-eslint/no-unused-vars: 0 */

import type {
	EmptyRequest,
	EmptyResponse,
	EmptyErrors,
	AdminMetaResponse,
	AdminMetaErrors,
	AdminAbuseUserReportsRequest,
	AdminAbuseUserReportsResponse,
	AdminAbuseUserReportsErrors,
	AdminAbuseReportNotificationRecipientListRequest,
	AdminAbuseReportNotificationRecipientListResponse,
	AdminAbuseReportNotificationRecipientListErrors,
	AdminAbuseReportNotificationRecipientShowRequest,
	AdminAbuseReportNotificationRecipientShowResponse,
	AdminAbuseReportNotificationRecipientShowErrors,
	AdminAbuseReportNotificationRecipientCreateRequest,
	AdminAbuseReportNotificationRecipientCreateResponse,
	AdminAbuseReportNotificationRecipientCreateErrors,
	AdminAbuseReportNotificationRecipientUpdateRequest,
	AdminAbuseReportNotificationRecipientUpdateResponse,
	AdminAbuseReportNotificationRecipientUpdateErrors,
	AdminAbuseReportNotificationRecipientDeleteRequest,
	AdminAbuseReportNotificationRecipientDeleteErrors,
	AdminAccountsCreateRequest,
	AdminAccountsCreateResponse,
	AdminAccountsCreateErrors,
	AdminAccountsDeleteRequest,
	AdminAccountsDeleteErrors,
	AdminAccountsFindByEmailRequest,
	AdminAccountsFindByEmailResponse,
	AdminAccountsFindByEmailErrors,
	AdminAdCreateRequest,
	AdminAdCreateResponse,
	AdminAdCreateErrors,
	AdminAdDeleteRequest,
	AdminAdDeleteErrors,
	AdminAdListRequest,
	AdminAdListResponse,
	AdminAdListErrors,
	AdminAdUpdateRequest,
	AdminAdUpdateErrors,
	AdminAnnouncementsCreateRequest,
	AdminAnnouncementsCreateResponse,
	AdminAnnouncementsCreateErrors,
	AdminAnnouncementsDeleteRequest,
	AdminAnnouncementsDeleteErrors,
	AdminAnnouncementsListRequest,
	AdminAnnouncementsListResponse,
	AdminAnnouncementsListErrors,
	AdminAnnouncementsUpdateRequest,
	AdminAnnouncementsUpdateErrors,
	AdminAvatarDecorationsCreateRequest,
	AdminAvatarDecorationsCreateErrors,
	AdminAvatarDecorationsDeleteRequest,
	AdminAvatarDecorationsDeleteErrors,
	AdminAvatarDecorationsListRequest,
	AdminAvatarDecorationsListResponse,
	AdminAvatarDecorationsListErrors,
	AdminAvatarDecorationsUpdateRequest,
	AdminAvatarDecorationsUpdateErrors,
	AdminDeleteAllFilesOfAUserRequest,
	AdminDeleteAllFilesOfAUserErrors,
	AdminUnsetUserAvatarRequest,
	AdminUnsetUserAvatarErrors,
	AdminUnsetUserBannerRequest,
	AdminUnsetUserBannerErrors,
	AdminDriveCleanRemoteFilesErrors,
	AdminDriveCleanupErrors,
	AdminDriveFilesRequest,
	AdminDriveFilesResponse,
	AdminDriveFilesErrors,
	AdminDriveShowFileRequest,
	AdminDriveShowFileResponse,
	AdminDriveShowFileErrors,
	AdminEmojiAddAliasesBulkRequest,
	AdminEmojiAddAliasesBulkErrors,
	AdminEmojiAddRequest,
	AdminEmojiAddResponse,
	AdminEmojiAddErrors,
	AdminEmojiCopyRequest,
	AdminEmojiCopyResponse,
	AdminEmojiCopyErrors,
	AdminEmojiDeleteBulkRequest,
	AdminEmojiDeleteBulkErrors,
	AdminEmojiDeleteRequest,
	AdminEmojiDeleteErrors,
	AdminEmojiImportZipRequest,
	AdminEmojiImportZipErrors,
	AdminEmojiListRemoteRequest,
	AdminEmojiListRemoteResponse,
	AdminEmojiListRemoteErrors,
	AdminEmojiListRequest,
	AdminEmojiListResponse,
	AdminEmojiListErrors,
	AdminEmojiRemoveAliasesBulkRequest,
	AdminEmojiRemoveAliasesBulkErrors,
	AdminEmojiSetAliasesBulkRequest,
	AdminEmojiSetAliasesBulkErrors,
	AdminEmojiSetCategoryBulkRequest,
	AdminEmojiSetCategoryBulkErrors,
	AdminEmojiSetLicenseBulkRequest,
	AdminEmojiSetLicenseBulkErrors,
	AdminEmojiUpdateRequest,
	AdminEmojiUpdateErrors,
	AdminFederationDeleteAllFilesRequest,
	AdminFederationDeleteAllFilesErrors,
	AdminFederationRefreshRemoteInstanceMetadataRequest,
	AdminFederationRefreshRemoteInstanceMetadataErrors,
	AdminFederationRemoveAllFollowingRequest,
	AdminFederationRemoveAllFollowingErrors,
	AdminFederationUpdateInstanceRequest,
	AdminFederationUpdateInstanceErrors,
	AdminGetIndexStatsResponse,
	AdminGetIndexStatsErrors,
	AdminGetTableStatsResponse,
	AdminGetTableStatsErrors,
	AdminGetUserIpsRequest,
	AdminGetUserIpsResponse,
	AdminGetUserIpsErrors,
	AdminInviteCreateRequest,
	AdminInviteCreateResponse,
	AdminInviteCreateErrors,
	AdminInviteListRequest,
	AdminInviteListResponse,
	AdminInviteListErrors,
	AdminPromoCreateRequest,
	AdminPromoCreateErrors,
	AdminQueueClearErrors,
	AdminQueueDeliverDelayedResponse,
	AdminQueueDeliverDelayedErrors,
	AdminQueueInboxDelayedResponse,
	AdminQueueInboxDelayedErrors,
	AdminQueuePromoteRequest,
	AdminQueuePromoteErrors,
	AdminQueueStatsResponse,
	AdminQueueStatsErrors,
	AdminRelaysAddRequest,
	AdminRelaysAddResponse,
	AdminRelaysAddErrors,
	AdminRelaysListResponse,
	AdminRelaysListErrors,
	AdminRelaysRemoveRequest,
	AdminRelaysRemoveErrors,
	AdminResetPasswordRequest,
	AdminResetPasswordResponse,
	AdminResetPasswordErrors,
	AdminResolveAbuseUserReportRequest,
	AdminResolveAbuseUserReportErrors,
	AdminForwardAbuseUserReportRequest,
	AdminForwardAbuseUserReportErrors,
	AdminUpdateAbuseUserReportRequest,
	AdminUpdateAbuseUserReportErrors,
	AdminSendEmailRequest,
	AdminSendEmailErrors,
	AdminServerInfoResponse,
	AdminServerInfoErrors,
	AdminShowModerationLogsRequest,
	AdminShowModerationLogsResponse,
	AdminShowModerationLogsErrors,
	AdminShowUserRequest,
	AdminShowUserResponse,
	AdminShowUserErrors,
	AdminShowUsersRequest,
	AdminShowUsersResponse,
	AdminShowUsersErrors,
	AdminSuspendUserRequest,
	AdminSuspendUserErrors,
	AdminUnsuspendUserRequest,
	AdminUnsuspendUserErrors,
	AdminUpdateMetaRequest,
	AdminUpdateMetaErrors,
	AdminDeleteAccountRequest,
	AdminDeleteAccountErrors,
	AdminUpdateUserNoteRequest,
	AdminUpdateUserNoteErrors,
	AdminRolesCreateRequest,
	AdminRolesCreateResponse,
	AdminRolesCreateErrors,
	AdminRolesDeleteRequest,
	AdminRolesDeleteErrors,
	AdminRolesListResponse,
	AdminRolesListErrors,
	AdminRolesShowRequest,
	AdminRolesShowResponse,
	AdminRolesShowErrors,
	AdminRolesUpdateRequest,
	AdminRolesUpdateErrors,
	AdminRolesAssignRequest,
	AdminRolesAssignErrors,
	AdminRolesUnassignRequest,
	AdminRolesUnassignErrors,
	AdminRolesUpdateDefaultPoliciesRequest,
	AdminRolesUpdateDefaultPoliciesErrors,
	AdminRolesUsersRequest,
	AdminRolesUsersResponse,
	AdminRolesUsersErrors,
	AdminSystemWebhookCreateRequest,
	AdminSystemWebhookCreateResponse,
	AdminSystemWebhookCreateErrors,
	AdminSystemWebhookDeleteRequest,
	AdminSystemWebhookDeleteErrors,
	AdminSystemWebhookListRequest,
	AdminSystemWebhookListResponse,
	AdminSystemWebhookListErrors,
	AdminSystemWebhookShowRequest,
	AdminSystemWebhookShowResponse,
	AdminSystemWebhookShowErrors,
	AdminSystemWebhookUpdateRequest,
	AdminSystemWebhookUpdateResponse,
	AdminSystemWebhookUpdateErrors,
	AdminSystemWebhookTestRequest,
	AdminSystemWebhookTestErrors,
	AnnouncementsRequest,
	AnnouncementsResponse,
	AnnouncementsErrors,
	AnnouncementsShowRequest,
	AnnouncementsShowResponse,
	AnnouncementsShowErrors,
	AntennasCreateRequest,
	AntennasCreateResponse,
	AntennasCreateErrors,
	AntennasDeleteRequest,
	AntennasDeleteErrors,
	AntennasListResponse,
	AntennasListErrors,
	AntennasNotesRequest,
	AntennasNotesResponse,
	AntennasNotesErrors,
	AntennasShowRequest,
	AntennasShowResponse,
	AntennasShowErrors,
	AntennasUpdateRequest,
	AntennasUpdateResponse,
	AntennasUpdateErrors,
	ApGetRequest,
	ApGetResponse,
	ApGetErrors,
	ApShowRequest,
	ApShowResponse,
	ApShowErrors,
	AppCreateRequest,
	AppCreateResponse,
	AppCreateErrors,
	AppShowRequest,
	AppShowResponse,
	AppShowErrors,
	AuthAcceptRequest,
	AuthAcceptErrors,
	AuthSessionGenerateRequest,
	AuthSessionGenerateResponse,
	AuthSessionGenerateErrors,
	AuthSessionShowRequest,
	AuthSessionShowResponse,
	AuthSessionShowErrors,
	AuthSessionUserkeyRequest,
	AuthSessionUserkeyResponse,
	AuthSessionUserkeyErrors,
	BlockingCreateRequest,
	BlockingCreateResponse,
	BlockingCreateErrors,
	BlockingDeleteRequest,
	BlockingDeleteResponse,
	BlockingDeleteErrors,
	BlockingListRequest,
	BlockingListResponse,
	BlockingListErrors,
	ChannelsCreateRequest,
	ChannelsCreateResponse,
	ChannelsCreateErrors,
	ChannelsFeaturedResponse,
	ChannelsFeaturedErrors,
	ChannelsFollowRequest,
	ChannelsFollowErrors,
	ChannelsFollowedRequest,
	ChannelsFollowedResponse,
	ChannelsFollowedErrors,
	ChannelsOwnedRequest,
	ChannelsOwnedResponse,
	ChannelsOwnedErrors,
	ChannelsShowRequest,
	ChannelsShowResponse,
	ChannelsShowErrors,
	ChannelsTimelineRequest,
	ChannelsTimelineResponse,
	ChannelsTimelineErrors,
	ChannelsUnfollowRequest,
	ChannelsUnfollowErrors,
	ChannelsUpdateRequest,
	ChannelsUpdateResponse,
	ChannelsUpdateErrors,
	ChannelsFavoriteRequest,
	ChannelsFavoriteErrors,
	ChannelsUnfavoriteRequest,
	ChannelsUnfavoriteErrors,
	ChannelsMyFavoritesResponse,
	ChannelsMyFavoritesErrors,
	ChannelsSearchRequest,
	ChannelsSearchResponse,
	ChannelsSearchErrors,
	ChartsActiveUsersRequest,
	ChartsActiveUsersResponse,
	ChartsActiveUsersErrors,
	ChartsApRequestRequest,
	ChartsApRequestResponse,
	ChartsApRequestErrors,
	ChartsDriveRequest,
	ChartsDriveResponse,
	ChartsDriveErrors,
	ChartsFederationRequest,
	ChartsFederationResponse,
	ChartsFederationErrors,
	ChartsInstanceRequest,
	ChartsInstanceResponse,
	ChartsInstanceErrors,
	ChartsNotesRequest,
	ChartsNotesResponse,
	ChartsNotesErrors,
	ChartsUserDriveRequest,
	ChartsUserDriveResponse,
	ChartsUserDriveErrors,
	ChartsUserFollowingRequest,
	ChartsUserFollowingResponse,
	ChartsUserFollowingErrors,
	ChartsUserNotesRequest,
	ChartsUserNotesResponse,
	ChartsUserNotesErrors,
	ChartsUserPvRequest,
	ChartsUserPvResponse,
	ChartsUserPvErrors,
	ChartsUserReactionsRequest,
	ChartsUserReactionsResponse,
	ChartsUserReactionsErrors,
	ChartsUsersRequest,
	ChartsUsersResponse,
	ChartsUsersErrors,
	ClipsAddNoteRequest,
	ClipsAddNoteErrors,
	ClipsRemoveNoteRequest,
	ClipsRemoveNoteErrors,
	ClipsCreateRequest,
	ClipsCreateResponse,
	ClipsCreateErrors,
	ClipsDeleteRequest,
	ClipsDeleteErrors,
	ClipsListResponse,
	ClipsListErrors,
	ClipsNotesRequest,
	ClipsNotesResponse,
	ClipsNotesErrors,
	ClipsShowRequest,
	ClipsShowResponse,
	ClipsShowErrors,
	ClipsUpdateRequest,
	ClipsUpdateResponse,
	ClipsUpdateErrors,
	ClipsFavoriteRequest,
	ClipsFavoriteErrors,
	ClipsUnfavoriteRequest,
	ClipsUnfavoriteErrors,
	ClipsMyFavoritesResponse,
	ClipsMyFavoritesErrors,
	DriveResponse,
	DriveErrors,
	DriveFilesRequest,
	DriveFilesResponse,
	DriveFilesErrors,
	DriveFilesAttachedNotesRequest,
	DriveFilesAttachedNotesResponse,
	DriveFilesAttachedNotesErrors,
	DriveFilesCheckExistenceRequest,
	DriveFilesCheckExistenceResponse,
	DriveFilesCheckExistenceErrors,
	DriveFilesCreateRequest,
	DriveFilesCreateResponse,
	DriveFilesCreateErrors,
	DriveFilesDeleteRequest,
	DriveFilesDeleteErrors,
	DriveFilesFindByHashRequest,
	DriveFilesFindByHashResponse,
	DriveFilesFindByHashErrors,
	DriveFilesFindRequest,
	DriveFilesFindResponse,
	DriveFilesFindErrors,
	DriveFilesShowRequest,
	DriveFilesShowResponse,
	DriveFilesShowErrors,
	DriveFilesUpdateRequest,
	DriveFilesUpdateResponse,
	DriveFilesUpdateErrors,
	DriveFilesUploadFromUrlRequest,
	DriveFilesUploadFromUrlErrors,
	DriveFoldersRequest,
	DriveFoldersResponse,
	DriveFoldersErrors,
	DriveFoldersCreateRequest,
	DriveFoldersCreateResponse,
	DriveFoldersCreateErrors,
	DriveFoldersDeleteRequest,
	DriveFoldersDeleteErrors,
	DriveFoldersFindRequest,
	DriveFoldersFindResponse,
	DriveFoldersFindErrors,
	DriveFoldersShowRequest,
	DriveFoldersShowResponse,
	DriveFoldersShowErrors,
	DriveFoldersUpdateRequest,
	DriveFoldersUpdateResponse,
	DriveFoldersUpdateErrors,
	DriveStreamRequest,
	DriveStreamResponse,
	DriveStreamErrors,
	EmailAddressAvailableRequest,
	EmailAddressAvailableResponse,
	EmailAddressAvailableErrors,
	EndpointRequest,
	EndpointResponse,
	EndpointErrors,
	EndpointsResponse,
	EndpointsErrors,
	ExportCustomEmojisErrors,
	FederationFollowersRequest,
	FederationFollowersResponse,
	FederationFollowersErrors,
	FederationFollowingRequest,
	FederationFollowingResponse,
	FederationFollowingErrors,
	FederationInstancesRequest,
	FederationInstancesResponse,
	FederationInstancesErrors,
	FederationShowInstanceRequest,
	FederationShowInstanceResponse,
	FederationShowInstanceErrors,
	FederationUpdateRemoteUserRequest,
	FederationUpdateRemoteUserErrors,
	FederationUsersRequest,
	FederationUsersResponse,
	FederationUsersErrors,
	FederationStatsRequest,
	FederationStatsResponse,
	FederationStatsErrors,
	FollowingCreateRequest,
	FollowingCreateResponse,
	FollowingCreateErrors,
	FollowingDeleteRequest,
	FollowingDeleteResponse,
	FollowingDeleteErrors,
	FollowingUpdateRequest,
	FollowingUpdateResponse,
	FollowingUpdateErrors,
	FollowingUpdateAllRequest,
	FollowingUpdateAllErrors,
	FollowingInvalidateRequest,
	FollowingInvalidateResponse,
	FollowingInvalidateErrors,
	FollowingRequestsAcceptRequest,
	FollowingRequestsAcceptErrors,
	FollowingRequestsCancelRequest,
	FollowingRequestsCancelResponse,
	FollowingRequestsCancelErrors,
	FollowingRequestsListRequest,
	FollowingRequestsListResponse,
	FollowingRequestsListErrors,
	FollowingRequestsRejectRequest,
	FollowingRequestsRejectErrors,
	GalleryFeaturedRequest,
	GalleryFeaturedResponse,
	GalleryFeaturedErrors,
	GalleryPopularResponse,
	GalleryPopularErrors,
	GalleryPostsRequest,
	GalleryPostsResponse,
	GalleryPostsErrors,
	GalleryPostsCreateRequest,
	GalleryPostsCreateResponse,
	GalleryPostsCreateErrors,
	GalleryPostsDeleteRequest,
	GalleryPostsDeleteErrors,
	GalleryPostsLikeRequest,
	GalleryPostsLikeErrors,
	GalleryPostsShowRequest,
	GalleryPostsShowResponse,
	GalleryPostsShowErrors,
	GalleryPostsUnlikeRequest,
	GalleryPostsUnlikeErrors,
	GalleryPostsUpdateRequest,
	GalleryPostsUpdateResponse,
	GalleryPostsUpdateErrors,
	GetOnlineUsersCountResponse,
	GetOnlineUsersCountErrors,
	GetAvatarDecorationsResponse,
	GetAvatarDecorationsErrors,
	HashtagsListRequest,
	HashtagsListResponse,
	HashtagsListErrors,
	HashtagsSearchRequest,
	HashtagsSearchResponse,
	HashtagsSearchErrors,
	HashtagsShowRequest,
	HashtagsShowResponse,
	HashtagsShowErrors,
	HashtagsTrendResponse,
	HashtagsTrendErrors,
	HashtagsUsersRequest,
	HashtagsUsersResponse,
	HashtagsUsersErrors,
	IResponse,
	IErrors,
	I2faDoneRequest,
	I2faDoneResponse,
	I2faDoneErrors,
	I2faKeyDoneRequest,
	I2faKeyDoneResponse,
	I2faKeyDoneErrors,
	I2faPasswordLessRequest,
	I2faPasswordLessErrors,
	I2faRegisterKeyRequest,
	I2faRegisterKeyResponse,
	I2faRegisterKeyErrors,
	I2faRegisterRequest,
	I2faRegisterResponse,
	I2faRegisterErrors,
	I2faUpdateKeyRequest,
	I2faUpdateKeyErrors,
	I2faRemoveKeyRequest,
	I2faRemoveKeyErrors,
	I2faUnregisterRequest,
	I2faUnregisterErrors,
	IAppsRequest,
	IAppsResponse,
	IAppsErrors,
	IAuthorizedAppsRequest,
	IAuthorizedAppsResponse,
	IAuthorizedAppsErrors,
	IClaimAchievementRequest,
	IClaimAchievementErrors,
	IChangePasswordRequest,
	IChangePasswordErrors,
	IDeleteAccountRequest,
	IDeleteAccountErrors,
	IExportBlockingErrors,
	IExportFollowingRequest,
	IExportFollowingErrors,
	IExportMuteErrors,
	IExportNotesErrors,
	IExportClipsErrors,
	IExportFavoritesErrors,
	IExportUserListsErrors,
	IExportAntennasErrors,
	IFavoritesRequest,
	IFavoritesResponse,
	IFavoritesErrors,
	IGalleryLikesRequest,
	IGalleryLikesResponse,
	IGalleryLikesErrors,
	IGalleryPostsRequest,
	IGalleryPostsResponse,
	IGalleryPostsErrors,
	IImportBlockingRequest,
	IImportBlockingErrors,
	IImportFollowingRequest,
	IImportFollowingErrors,
	IImportMutingRequest,
	IImportMutingErrors,
	IImportUserListsRequest,
	IImportUserListsErrors,
	IImportAntennasRequest,
	IImportAntennasErrors,
	INotificationsRequest,
	INotificationsResponse,
	INotificationsErrors,
	INotificationsGroupedRequest,
	INotificationsGroupedResponse,
	INotificationsGroupedErrors,
	IPageLikesRequest,
	IPageLikesResponse,
	IPageLikesErrors,
	IPagesRequest,
	IPagesResponse,
	IPagesErrors,
	IPinRequest,
	IPinResponse,
	IPinErrors,
	IReadAllUnreadNotesErrors,
	IReadAnnouncementRequest,
	IReadAnnouncementErrors,
	IRegenerateTokenRequest,
	IRegenerateTokenErrors,
	IRegistryGetAllRequest,
	IRegistryGetAllResponse,
	IRegistryGetAllErrors,
	IRegistryGetDetailRequest,
	IRegistryGetDetailResponse,
	IRegistryGetDetailErrors,
	IRegistryGetRequest,
	IRegistryGetResponse,
	IRegistryGetErrors,
	IRegistryKeysWithTypeRequest,
	IRegistryKeysWithTypeResponse,
	IRegistryKeysWithTypeErrors,
	IRegistryKeysRequest,
	IRegistryKeysResponse,
	IRegistryKeysErrors,
	IRegistryRemoveRequest,
	IRegistryRemoveErrors,
	IRegistryScopesWithDomainResponse,
	IRegistryScopesWithDomainErrors,
	IRegistrySetRequest,
	IRegistrySetErrors,
	IRevokeTokenRequest,
	IRevokeTokenErrors,
	ISigninHistoryRequest,
	ISigninHistoryResponse,
	ISigninHistoryErrors,
	IUnpinRequest,
	IUnpinResponse,
	IUnpinErrors,
	IUpdateEmailRequest,
	IUpdateEmailResponse,
	IUpdateEmailErrors,
	IUpdateRequest,
	IUpdateResponse,
	IUpdateErrors,
	IMoveRequest,
	IMoveResponse,
	IMoveErrors,
	IWebhooksCreateRequest,
	IWebhooksCreateResponse,
	IWebhooksCreateErrors,
	IWebhooksListResponse,
	IWebhooksListErrors,
	IWebhooksShowRequest,
	IWebhooksShowResponse,
	IWebhooksShowErrors,
	IWebhooksUpdateRequest,
	IWebhooksUpdateErrors,
	IWebhooksDeleteRequest,
	IWebhooksDeleteErrors,
	IWebhooksTestRequest,
	IWebhooksTestErrors,
	InviteCreateResponse,
	InviteCreateErrors,
	InviteDeleteRequest,
	InviteDeleteErrors,
	InviteListRequest,
	InviteListResponse,
	InviteListErrors,
	InviteLimitResponse,
	InviteLimitErrors,
	MetaRequest,
	MetaResponse,
	MetaErrors,
	EmojisResponse,
	EmojisErrors,
	EmojiRequest,
	EmojiResponse,
	EmojiErrors,
	MiauthGenTokenRequest,
	MiauthGenTokenResponse,
	MiauthGenTokenErrors,
	MuteCreateRequest,
	MuteCreateErrors,
	MuteDeleteRequest,
	MuteDeleteErrors,
	MuteListRequest,
	MuteListResponse,
	MuteListErrors,
	RenoteMuteCreateRequest,
	RenoteMuteCreateErrors,
	RenoteMuteDeleteRequest,
	RenoteMuteDeleteErrors,
	RenoteMuteListRequest,
	RenoteMuteListResponse,
	RenoteMuteListErrors,
	MyAppsRequest,
	MyAppsResponse,
	MyAppsErrors,
	NotesRequest,
	NotesResponse,
	NotesErrors,
	NotesChildrenRequest,
	NotesChildrenResponse,
	NotesChildrenErrors,
	NotesClipsRequest,
	NotesClipsResponse,
	NotesClipsErrors,
	NotesConversationRequest,
	NotesConversationResponse,
	NotesConversationErrors,
	NotesCreateRequest,
	NotesCreateResponse,
	NotesCreateErrors,
	NotesDeleteRequest,
	NotesDeleteErrors,
	NotesFavoritesCreateRequest,
	NotesFavoritesCreateErrors,
	NotesFavoritesDeleteRequest,
	NotesFavoritesDeleteErrors,
	NotesFeaturedRequest,
	NotesFeaturedResponse,
	NotesFeaturedErrors,
	NotesGlobalTimelineRequest,
	NotesGlobalTimelineResponse,
	NotesGlobalTimelineErrors,
	NotesHybridTimelineRequest,
	NotesHybridTimelineResponse,
	NotesHybridTimelineErrors,
	NotesLocalTimelineRequest,
	NotesLocalTimelineResponse,
	NotesLocalTimelineErrors,
	NotesMentionsRequest,
	NotesMentionsResponse,
	NotesMentionsErrors,
	NotesPollsRecommendationRequest,
	NotesPollsRecommendationResponse,
	NotesPollsRecommendationErrors,
	NotesPollsVoteRequest,
	NotesPollsVoteErrors,
	NotesReactionsRequest,
	NotesReactionsResponse,
	NotesReactionsErrors,
	NotesReactionsCreateRequest,
	NotesReactionsCreateErrors,
	NotesReactionsDeleteRequest,
	NotesReactionsDeleteErrors,
	NotesRenotesRequest,
	NotesRenotesResponse,
	NotesRenotesErrors,
	NotesRepliesRequest,
	NotesRepliesResponse,
	NotesRepliesErrors,
	NotesSearchByTagRequest,
	NotesSearchByTagResponse,
	NotesSearchByTagErrors,
	NotesSearchRequest,
	NotesSearchResponse,
	NotesSearchErrors,
	NotesShowRequest,
	NotesShowResponse,
	NotesShowErrors,
	NotesStateRequest,
	NotesStateResponse,
	NotesStateErrors,
	NotesThreadMutingCreateRequest,
	NotesThreadMutingCreateErrors,
	NotesThreadMutingDeleteRequest,
	NotesThreadMutingDeleteErrors,
	NotesTimelineRequest,
	NotesTimelineResponse,
	NotesTimelineErrors,
	NotesTranslateRequest,
	NotesTranslateResponse,
	NotesTranslateErrors,
	NotesUnrenoteRequest,
	NotesUnrenoteErrors,
	NotesUserListTimelineRequest,
	NotesUserListTimelineResponse,
	NotesUserListTimelineErrors,
	NotificationsCreateRequest,
	NotificationsCreateErrors,
	NotificationsFlushErrors,
	NotificationsMarkAllAsReadErrors,
	NotificationsTestNotificationErrors,
	PagePushRequest,
	PagePushErrors,
	PagesCreateRequest,
	PagesCreateResponse,
	PagesCreateErrors,
	PagesDeleteRequest,
	PagesDeleteErrors,
	PagesFeaturedResponse,
	PagesFeaturedErrors,
	PagesLikeRequest,
	PagesLikeErrors,
	PagesShowRequest,
	PagesShowResponse,
	PagesShowErrors,
	PagesUnlikeRequest,
	PagesUnlikeErrors,
	PagesUpdateRequest,
	PagesUpdateErrors,
	FlashCreateRequest,
	FlashCreateResponse,
	FlashCreateErrors,
	FlashDeleteRequest,
	FlashDeleteErrors,
	FlashFeaturedRequest,
	FlashFeaturedResponse,
	FlashFeaturedErrors,
	FlashLikeRequest,
	FlashLikeErrors,
	FlashShowRequest,
	FlashShowResponse,
	FlashShowErrors,
	FlashUnlikeRequest,
	FlashUnlikeErrors,
	FlashUpdateRequest,
	FlashUpdateErrors,
	FlashMyRequest,
	FlashMyResponse,
	FlashMyErrors,
	FlashMyLikesRequest,
	FlashMyLikesResponse,
	FlashMyLikesErrors,
	PingResponse,
	PingErrors,
	PinnedUsersResponse,
	PinnedUsersErrors,
	PromoReadRequest,
	PromoReadErrors,
	RolesListResponse,
	RolesListErrors,
	RolesShowRequest,
	RolesShowResponse,
	RolesShowErrors,
	RolesUsersRequest,
	RolesUsersResponse,
	RolesUsersErrors,
	RolesNotesRequest,
	RolesNotesResponse,
	RolesNotesErrors,
	RequestResetPasswordRequest,
	RequestResetPasswordErrors,
	ResetDbErrors,
	ResetPasswordRequest,
	ResetPasswordErrors,
	ServerInfoResponse,
	ServerInfoErrors,
	StatsResponse,
	StatsErrors,
	SwShowRegistrationRequest,
	SwShowRegistrationResponse,
	SwShowRegistrationErrors,
	SwUpdateRegistrationRequest,
	SwUpdateRegistrationResponse,
	SwUpdateRegistrationErrors,
	SwRegisterRequest,
	SwRegisterResponse,
	SwRegisterErrors,
	SwUnregisterRequest,
	SwUnregisterErrors,
	TestRequest,
	TestResponse,
	TestErrors,
	UsernameAvailableRequest,
	UsernameAvailableResponse,
	UsernameAvailableErrors,
	UsersRequest,
	UsersResponse,
	UsersErrors,
	UsersClipsRequest,
	UsersClipsResponse,
	UsersClipsErrors,
	UsersFollowersRequest,
	UsersFollowersResponse,
	UsersFollowersErrors,
	UsersFollowingRequest,
	UsersFollowingResponse,
	UsersFollowingErrors,
	UsersGalleryPostsRequest,
	UsersGalleryPostsResponse,
	UsersGalleryPostsErrors,
	UsersGetFrequentlyRepliedUsersRequest,
	UsersGetFrequentlyRepliedUsersResponse,
	UsersGetFrequentlyRepliedUsersErrors,
	UsersFeaturedNotesRequest,
	UsersFeaturedNotesResponse,
	UsersFeaturedNotesErrors,
	UsersListsCreateRequest,
	UsersListsCreateResponse,
	UsersListsCreateErrors,
	UsersListsDeleteRequest,
	UsersListsDeleteErrors,
	UsersListsListRequest,
	UsersListsListResponse,
	UsersListsListErrors,
	UsersListsPullRequest,
	UsersListsPullErrors,
	UsersListsPushRequest,
	UsersListsPushErrors,
	UsersListsShowRequest,
	UsersListsShowResponse,
	UsersListsShowErrors,
	UsersListsFavoriteRequest,
	UsersListsFavoriteErrors,
	UsersListsUnfavoriteRequest,
	UsersListsUnfavoriteErrors,
	UsersListsUpdateRequest,
	UsersListsUpdateResponse,
	UsersListsUpdateErrors,
	UsersListsCreateFromPublicRequest,
	UsersListsCreateFromPublicResponse,
	UsersListsCreateFromPublicErrors,
	UsersListsUpdateMembershipRequest,
	UsersListsUpdateMembershipErrors,
	UsersListsGetMembershipsRequest,
	UsersListsGetMembershipsResponse,
	UsersListsGetMembershipsErrors,
	UsersNotesRequest,
	UsersNotesResponse,
	UsersNotesErrors,
	UsersPagesRequest,
	UsersPagesResponse,
	UsersPagesErrors,
	UsersFlashsRequest,
	UsersFlashsResponse,
	UsersFlashsErrors,
	UsersReactionsRequest,
	UsersReactionsResponse,
	UsersReactionsErrors,
	UsersRecommendationRequest,
	UsersRecommendationResponse,
	UsersRecommendationErrors,
	UsersRelationRequest,
	UsersRelationResponse,
	UsersRelationErrors,
	UsersReportAbuseRequest,
	UsersReportAbuseErrors,
	UsersSearchByUsernameAndHostRequest,
	UsersSearchByUsernameAndHostResponse,
	UsersSearchByUsernameAndHostErrors,
	UsersSearchRequest,
	UsersSearchResponse,
	UsersSearchErrors,
	UsersShowRequest,
	UsersShowResponse,
	UsersShowErrors,
	UsersAchievementsRequest,
	UsersAchievementsResponse,
	UsersAchievementsErrors,
	UsersUpdateMemoRequest,
	UsersUpdateMemoErrors,
	FetchRssRequest,
	FetchRssResponse,
	FetchRssErrors,
	FetchExternalResourcesRequest,
	FetchExternalResourcesResponse,
	FetchExternalResourcesErrors,
	RetentionResponse,
	RetentionErrors,
	BubbleGameRegisterRequest,
	BubbleGameRegisterErrors,
	BubbleGameRankingRequest,
	BubbleGameRankingResponse,
	BubbleGameRankingErrors,
	ReversiCancelMatchRequest,
	ReversiCancelMatchErrors,
	ReversiGamesRequest,
	ReversiGamesResponse,
	ReversiGamesErrors,
	ReversiMatchRequest,
	ReversiMatchResponse,
	ReversiMatchErrors,
	ReversiInvitationsResponse,
	ReversiInvitationsErrors,
	ReversiShowGameRequest,
	ReversiShowGameResponse,
	ReversiShowGameErrors,
	ReversiSurrenderRequest,
	ReversiSurrenderErrors,
	ReversiVerifyRequest,
	ReversiVerifyResponse,
	ReversiVerifyErrors,
} from './entities.js';

export type Endpoints = {
	'admin/meta': { req: EmptyRequest; res: AdminMetaResponse; errors: AdminMetaErrors };
	'admin/abuse-user-reports': { req: AdminAbuseUserReportsRequest; res: AdminAbuseUserReportsResponse; errors: AdminAbuseUserReportsErrors };
	'admin/abuse-report/notification-recipient/list': { req: AdminAbuseReportNotificationRecipientListRequest; res: AdminAbuseReportNotificationRecipientListResponse; errors: AdminAbuseReportNotificationRecipientListErrors };
	'admin/abuse-report/notification-recipient/show': { req: AdminAbuseReportNotificationRecipientShowRequest; res: AdminAbuseReportNotificationRecipientShowResponse; errors: AdminAbuseReportNotificationRecipientShowErrors };
	'admin/abuse-report/notification-recipient/create': { req: AdminAbuseReportNotificationRecipientCreateRequest; res: AdminAbuseReportNotificationRecipientCreateResponse; errors: AdminAbuseReportNotificationRecipientCreateErrors };
	'admin/abuse-report/notification-recipient/update': { req: AdminAbuseReportNotificationRecipientUpdateRequest; res: AdminAbuseReportNotificationRecipientUpdateResponse; errors: AdminAbuseReportNotificationRecipientUpdateErrors };
	'admin/abuse-report/notification-recipient/delete': { req: AdminAbuseReportNotificationRecipientDeleteRequest; res: EmptyResponse; errors: AdminAbuseReportNotificationRecipientDeleteErrors };
	'admin/accounts/create': { req: AdminAccountsCreateRequest; res: AdminAccountsCreateResponse; errors: AdminAccountsCreateErrors };
	'admin/accounts/delete': { req: AdminAccountsDeleteRequest; res: EmptyResponse; errors: AdminAccountsDeleteErrors };
	'admin/accounts/find-by-email': { req: AdminAccountsFindByEmailRequest; res: AdminAccountsFindByEmailResponse; errors: AdminAccountsFindByEmailErrors };
	'admin/ad/create': { req: AdminAdCreateRequest; res: AdminAdCreateResponse; errors: AdminAdCreateErrors };
	'admin/ad/delete': { req: AdminAdDeleteRequest; res: EmptyResponse; errors: AdminAdDeleteErrors };
	'admin/ad/list': { req: AdminAdListRequest; res: AdminAdListResponse; errors: AdminAdListErrors };
	'admin/ad/update': { req: AdminAdUpdateRequest; res: EmptyResponse; errors: AdminAdUpdateErrors };
	'admin/announcements/create': { req: AdminAnnouncementsCreateRequest; res: AdminAnnouncementsCreateResponse; errors: AdminAnnouncementsCreateErrors };
	'admin/announcements/delete': { req: AdminAnnouncementsDeleteRequest; res: EmptyResponse; errors: AdminAnnouncementsDeleteErrors };
	'admin/announcements/list': { req: AdminAnnouncementsListRequest; res: AdminAnnouncementsListResponse; errors: AdminAnnouncementsListErrors };
	'admin/announcements/update': { req: AdminAnnouncementsUpdateRequest; res: EmptyResponse; errors: AdminAnnouncementsUpdateErrors };
	'admin/avatar-decorations/create': { req: AdminAvatarDecorationsCreateRequest; res: EmptyResponse; errors: AdminAvatarDecorationsCreateErrors };
	'admin/avatar-decorations/delete': { req: AdminAvatarDecorationsDeleteRequest; res: EmptyResponse; errors: AdminAvatarDecorationsDeleteErrors };
	'admin/avatar-decorations/list': { req: AdminAvatarDecorationsListRequest; res: AdminAvatarDecorationsListResponse; errors: AdminAvatarDecorationsListErrors };
	'admin/avatar-decorations/update': { req: AdminAvatarDecorationsUpdateRequest; res: EmptyResponse; errors: AdminAvatarDecorationsUpdateErrors };
	'admin/delete-all-files-of-a-user': { req: AdminDeleteAllFilesOfAUserRequest; res: EmptyResponse; errors: AdminDeleteAllFilesOfAUserErrors };
	'admin/unset-user-avatar': { req: AdminUnsetUserAvatarRequest; res: EmptyResponse; errors: AdminUnsetUserAvatarErrors };
	'admin/unset-user-banner': { req: AdminUnsetUserBannerRequest; res: EmptyResponse; errors: AdminUnsetUserBannerErrors };
	'admin/drive/clean-remote-files': { req: EmptyRequest; res: EmptyResponse; errors: AdminDriveCleanRemoteFilesErrors };
	'admin/drive/cleanup': { req: EmptyRequest; res: EmptyResponse; errors: AdminDriveCleanupErrors };
	'admin/drive/files': { req: AdminDriveFilesRequest; res: AdminDriveFilesResponse; errors: AdminDriveFilesErrors };
	'admin/drive/show-file': { req: AdminDriveShowFileRequest; res: AdminDriveShowFileResponse; errors: AdminDriveShowFileErrors };
	'admin/emoji/add-aliases-bulk': { req: AdminEmojiAddAliasesBulkRequest; res: EmptyResponse; errors: AdminEmojiAddAliasesBulkErrors };
	'admin/emoji/add': { req: AdminEmojiAddRequest; res: AdminEmojiAddResponse; errors: AdminEmojiAddErrors };
	'admin/emoji/copy': { req: AdminEmojiCopyRequest; res: AdminEmojiCopyResponse; errors: AdminEmojiCopyErrors };
	'admin/emoji/delete-bulk': { req: AdminEmojiDeleteBulkRequest; res: EmptyResponse; errors: AdminEmojiDeleteBulkErrors };
	'admin/emoji/delete': { req: AdminEmojiDeleteRequest; res: EmptyResponse; errors: AdminEmojiDeleteErrors };
	'admin/emoji/import-zip': { req: AdminEmojiImportZipRequest; res: EmptyResponse; errors: AdminEmojiImportZipErrors };
	'admin/emoji/list-remote': { req: AdminEmojiListRemoteRequest; res: AdminEmojiListRemoteResponse; errors: AdminEmojiListRemoteErrors };
	'admin/emoji/list': { req: AdminEmojiListRequest; res: AdminEmojiListResponse; errors: AdminEmojiListErrors };
	'admin/emoji/remove-aliases-bulk': { req: AdminEmojiRemoveAliasesBulkRequest; res: EmptyResponse; errors: AdminEmojiRemoveAliasesBulkErrors };
	'admin/emoji/set-aliases-bulk': { req: AdminEmojiSetAliasesBulkRequest; res: EmptyResponse; errors: AdminEmojiSetAliasesBulkErrors };
	'admin/emoji/set-category-bulk': { req: AdminEmojiSetCategoryBulkRequest; res: EmptyResponse; errors: AdminEmojiSetCategoryBulkErrors };
	'admin/emoji/set-license-bulk': { req: AdminEmojiSetLicenseBulkRequest; res: EmptyResponse; errors: AdminEmojiSetLicenseBulkErrors };
	'admin/emoji/update': { req: AdminEmojiUpdateRequest; res: EmptyResponse; errors: AdminEmojiUpdateErrors };
	'admin/federation/delete-all-files': { req: AdminFederationDeleteAllFilesRequest; res: EmptyResponse; errors: AdminFederationDeleteAllFilesErrors };
	'admin/federation/refresh-remote-instance-metadata': { req: AdminFederationRefreshRemoteInstanceMetadataRequest; res: EmptyResponse; errors: AdminFederationRefreshRemoteInstanceMetadataErrors };
	'admin/federation/remove-all-following': { req: AdminFederationRemoveAllFollowingRequest; res: EmptyResponse; errors: AdminFederationRemoveAllFollowingErrors };
	'admin/federation/update-instance': { req: AdminFederationUpdateInstanceRequest; res: EmptyResponse; errors: AdminFederationUpdateInstanceErrors };
	'admin/get-index-stats': { req: EmptyRequest; res: AdminGetIndexStatsResponse; errors: AdminGetIndexStatsErrors };
	'admin/get-table-stats': { req: EmptyRequest; res: AdminGetTableStatsResponse; errors: AdminGetTableStatsErrors };
	'admin/get-user-ips': { req: AdminGetUserIpsRequest; res: AdminGetUserIpsResponse; errors: AdminGetUserIpsErrors };
	'admin/invite/create': { req: AdminInviteCreateRequest; res: AdminInviteCreateResponse; errors: AdminInviteCreateErrors };
	'admin/invite/list': { req: AdminInviteListRequest; res: AdminInviteListResponse; errors: AdminInviteListErrors };
	'admin/promo/create': { req: AdminPromoCreateRequest; res: EmptyResponse; errors: AdminPromoCreateErrors };
	'admin/queue/clear': { req: EmptyRequest; res: EmptyResponse; errors: AdminQueueClearErrors };
	'admin/queue/deliver-delayed': { req: EmptyRequest; res: AdminQueueDeliverDelayedResponse; errors: AdminQueueDeliverDelayedErrors };
	'admin/queue/inbox-delayed': { req: EmptyRequest; res: AdminQueueInboxDelayedResponse; errors: AdminQueueInboxDelayedErrors };
	'admin/queue/promote': { req: AdminQueuePromoteRequest; res: EmptyResponse; errors: AdminQueuePromoteErrors };
	'admin/queue/stats': { req: EmptyRequest; res: AdminQueueStatsResponse; errors: AdminQueueStatsErrors };
	'admin/relays/add': { req: AdminRelaysAddRequest; res: AdminRelaysAddResponse; errors: AdminRelaysAddErrors };
	'admin/relays/list': { req: EmptyRequest; res: AdminRelaysListResponse; errors: AdminRelaysListErrors };
	'admin/relays/remove': { req: AdminRelaysRemoveRequest; res: EmptyResponse; errors: AdminRelaysRemoveErrors };
	'admin/reset-password': { req: AdminResetPasswordRequest; res: AdminResetPasswordResponse; errors: AdminResetPasswordErrors };
	'admin/resolve-abuse-user-report': { req: AdminResolveAbuseUserReportRequest; res: EmptyResponse; errors: AdminResolveAbuseUserReportErrors };
	'admin/forward-abuse-user-report': { req: AdminForwardAbuseUserReportRequest; res: EmptyResponse; errors: AdminForwardAbuseUserReportErrors };
	'admin/update-abuse-user-report': { req: AdminUpdateAbuseUserReportRequest; res: EmptyResponse; errors: AdminUpdateAbuseUserReportErrors };
	'admin/send-email': { req: AdminSendEmailRequest; res: EmptyResponse; errors: AdminSendEmailErrors };
	'admin/server-info': { req: EmptyRequest; res: AdminServerInfoResponse; errors: AdminServerInfoErrors };
	'admin/show-moderation-logs': { req: AdminShowModerationLogsRequest; res: AdminShowModerationLogsResponse; errors: AdminShowModerationLogsErrors };
	'admin/show-user': { req: AdminShowUserRequest; res: AdminShowUserResponse; errors: AdminShowUserErrors };
	'admin/show-users': { req: AdminShowUsersRequest; res: AdminShowUsersResponse; errors: AdminShowUsersErrors };
	'admin/suspend-user': { req: AdminSuspendUserRequest; res: EmptyResponse; errors: AdminSuspendUserErrors };
	'admin/unsuspend-user': { req: AdminUnsuspendUserRequest; res: EmptyResponse; errors: AdminUnsuspendUserErrors };
	'admin/update-meta': { req: AdminUpdateMetaRequest; res: EmptyResponse; errors: AdminUpdateMetaErrors };
	'admin/delete-account': { req: AdminDeleteAccountRequest; res: EmptyResponse; errors: AdminDeleteAccountErrors };
	'admin/update-user-note': { req: AdminUpdateUserNoteRequest; res: EmptyResponse; errors: AdminUpdateUserNoteErrors };
	'admin/roles/create': { req: AdminRolesCreateRequest; res: AdminRolesCreateResponse; errors: AdminRolesCreateErrors };
	'admin/roles/delete': { req: AdminRolesDeleteRequest; res: EmptyResponse; errors: AdminRolesDeleteErrors };
	'admin/roles/list': { req: EmptyRequest; res: AdminRolesListResponse; errors: AdminRolesListErrors };
	'admin/roles/show': { req: AdminRolesShowRequest; res: AdminRolesShowResponse; errors: AdminRolesShowErrors };
	'admin/roles/update': { req: AdminRolesUpdateRequest; res: EmptyResponse; errors: AdminRolesUpdateErrors };
	'admin/roles/assign': { req: AdminRolesAssignRequest; res: EmptyResponse; errors: AdminRolesAssignErrors };
	'admin/roles/unassign': { req: AdminRolesUnassignRequest; res: EmptyResponse; errors: AdminRolesUnassignErrors };
	'admin/roles/update-default-policies': { req: AdminRolesUpdateDefaultPoliciesRequest; res: EmptyResponse; errors: AdminRolesUpdateDefaultPoliciesErrors };
	'admin/roles/users': { req: AdminRolesUsersRequest; res: AdminRolesUsersResponse; errors: AdminRolesUsersErrors };
	'admin/system-webhook/create': { req: AdminSystemWebhookCreateRequest; res: AdminSystemWebhookCreateResponse; errors: AdminSystemWebhookCreateErrors };
	'admin/system-webhook/delete': { req: AdminSystemWebhookDeleteRequest; res: EmptyResponse; errors: AdminSystemWebhookDeleteErrors };
	'admin/system-webhook/list': { req: AdminSystemWebhookListRequest; res: AdminSystemWebhookListResponse; errors: AdminSystemWebhookListErrors };
	'admin/system-webhook/show': { req: AdminSystemWebhookShowRequest; res: AdminSystemWebhookShowResponse; errors: AdminSystemWebhookShowErrors };
	'admin/system-webhook/update': { req: AdminSystemWebhookUpdateRequest; res: AdminSystemWebhookUpdateResponse; errors: AdminSystemWebhookUpdateErrors };
	'admin/system-webhook/test': { req: AdminSystemWebhookTestRequest; res: EmptyResponse; errors: AdminSystemWebhookTestErrors };
	'announcements': { req: AnnouncementsRequest; res: AnnouncementsResponse; errors: AnnouncementsErrors };
	'announcements/show': { req: AnnouncementsShowRequest; res: AnnouncementsShowResponse; errors: AnnouncementsShowErrors };
	'antennas/create': { req: AntennasCreateRequest; res: AntennasCreateResponse; errors: AntennasCreateErrors };
	'antennas/delete': { req: AntennasDeleteRequest; res: EmptyResponse; errors: AntennasDeleteErrors };
	'antennas/list': { req: EmptyRequest; res: AntennasListResponse; errors: AntennasListErrors };
	'antennas/notes': { req: AntennasNotesRequest; res: AntennasNotesResponse; errors: AntennasNotesErrors };
	'antennas/show': { req: AntennasShowRequest; res: AntennasShowResponse; errors: AntennasShowErrors };
	'antennas/update': { req: AntennasUpdateRequest; res: AntennasUpdateResponse; errors: AntennasUpdateErrors };
	'ap/get': { req: ApGetRequest; res: ApGetResponse; errors: ApGetErrors };
	'ap/show': { req: ApShowRequest; res: ApShowResponse; errors: ApShowErrors };
	'app/create': { req: AppCreateRequest; res: AppCreateResponse; errors: AppCreateErrors };
	'app/show': { req: AppShowRequest; res: AppShowResponse; errors: AppShowErrors };
	'auth/accept': { req: AuthAcceptRequest; res: EmptyResponse; errors: AuthAcceptErrors };
	'auth/session/generate': { req: AuthSessionGenerateRequest; res: AuthSessionGenerateResponse; errors: AuthSessionGenerateErrors };
	'auth/session/show': { req: AuthSessionShowRequest; res: AuthSessionShowResponse; errors: AuthSessionShowErrors };
	'auth/session/userkey': { req: AuthSessionUserkeyRequest; res: AuthSessionUserkeyResponse; errors: AuthSessionUserkeyErrors };
	'blocking/create': { req: BlockingCreateRequest; res: BlockingCreateResponse; errors: BlockingCreateErrors };
	'blocking/delete': { req: BlockingDeleteRequest; res: BlockingDeleteResponse; errors: BlockingDeleteErrors };
	'blocking/list': { req: BlockingListRequest; res: BlockingListResponse; errors: BlockingListErrors };
	'channels/create': { req: ChannelsCreateRequest; res: ChannelsCreateResponse; errors: ChannelsCreateErrors };
	'channels/featured': { req: EmptyRequest; res: ChannelsFeaturedResponse; errors: ChannelsFeaturedErrors };
	'channels/follow': { req: ChannelsFollowRequest; res: EmptyResponse; errors: ChannelsFollowErrors };
	'channels/followed': { req: ChannelsFollowedRequest; res: ChannelsFollowedResponse; errors: ChannelsFollowedErrors };
	'channels/owned': { req: ChannelsOwnedRequest; res: ChannelsOwnedResponse; errors: ChannelsOwnedErrors };
	'channels/show': { req: ChannelsShowRequest; res: ChannelsShowResponse; errors: ChannelsShowErrors };
	'channels/timeline': { req: ChannelsTimelineRequest; res: ChannelsTimelineResponse; errors: ChannelsTimelineErrors };
	'channels/unfollow': { req: ChannelsUnfollowRequest; res: EmptyResponse; errors: ChannelsUnfollowErrors };
	'channels/update': { req: ChannelsUpdateRequest; res: ChannelsUpdateResponse; errors: ChannelsUpdateErrors };
	'channels/favorite': { req: ChannelsFavoriteRequest; res: EmptyResponse; errors: ChannelsFavoriteErrors };
	'channels/unfavorite': { req: ChannelsUnfavoriteRequest; res: EmptyResponse; errors: ChannelsUnfavoriteErrors };
	'channels/my-favorites': { req: EmptyRequest; res: ChannelsMyFavoritesResponse; errors: ChannelsMyFavoritesErrors };
	'channels/search': { req: ChannelsSearchRequest; res: ChannelsSearchResponse; errors: ChannelsSearchErrors };
	'charts/active-users': { req: ChartsActiveUsersRequest; res: ChartsActiveUsersResponse; errors: ChartsActiveUsersErrors };
	'charts/ap-request': { req: ChartsApRequestRequest; res: ChartsApRequestResponse; errors: ChartsApRequestErrors };
	'charts/drive': { req: ChartsDriveRequest; res: ChartsDriveResponse; errors: ChartsDriveErrors };
	'charts/federation': { req: ChartsFederationRequest; res: ChartsFederationResponse; errors: ChartsFederationErrors };
	'charts/instance': { req: ChartsInstanceRequest; res: ChartsInstanceResponse; errors: ChartsInstanceErrors };
	'charts/notes': { req: ChartsNotesRequest; res: ChartsNotesResponse; errors: ChartsNotesErrors };
	'charts/user/drive': { req: ChartsUserDriveRequest; res: ChartsUserDriveResponse; errors: ChartsUserDriveErrors };
	'charts/user/following': { req: ChartsUserFollowingRequest; res: ChartsUserFollowingResponse; errors: ChartsUserFollowingErrors };
	'charts/user/notes': { req: ChartsUserNotesRequest; res: ChartsUserNotesResponse; errors: ChartsUserNotesErrors };
	'charts/user/pv': { req: ChartsUserPvRequest; res: ChartsUserPvResponse; errors: ChartsUserPvErrors };
	'charts/user/reactions': { req: ChartsUserReactionsRequest; res: ChartsUserReactionsResponse; errors: ChartsUserReactionsErrors };
	'charts/users': { req: ChartsUsersRequest; res: ChartsUsersResponse; errors: ChartsUsersErrors };
	'clips/add-note': { req: ClipsAddNoteRequest; res: EmptyResponse; errors: ClipsAddNoteErrors };
	'clips/remove-note': { req: ClipsRemoveNoteRequest; res: EmptyResponse; errors: ClipsRemoveNoteErrors };
	'clips/create': { req: ClipsCreateRequest; res: ClipsCreateResponse; errors: ClipsCreateErrors };
	'clips/delete': { req: ClipsDeleteRequest; res: EmptyResponse; errors: ClipsDeleteErrors };
	'clips/list': { req: EmptyRequest; res: ClipsListResponse; errors: ClipsListErrors };
	'clips/notes': { req: ClipsNotesRequest; res: ClipsNotesResponse; errors: ClipsNotesErrors };
	'clips/show': { req: ClipsShowRequest; res: ClipsShowResponse; errors: ClipsShowErrors };
	'clips/update': { req: ClipsUpdateRequest; res: ClipsUpdateResponse; errors: ClipsUpdateErrors };
	'clips/favorite': { req: ClipsFavoriteRequest; res: EmptyResponse; errors: ClipsFavoriteErrors };
	'clips/unfavorite': { req: ClipsUnfavoriteRequest; res: EmptyResponse; errors: ClipsUnfavoriteErrors };
	'clips/my-favorites': { req: EmptyRequest; res: ClipsMyFavoritesResponse; errors: ClipsMyFavoritesErrors };
	'drive': { req: EmptyRequest; res: DriveResponse; errors: DriveErrors };
	'drive/files': { req: DriveFilesRequest; res: DriveFilesResponse; errors: DriveFilesErrors };
	'drive/files/attached-notes': { req: DriveFilesAttachedNotesRequest; res: DriveFilesAttachedNotesResponse; errors: DriveFilesAttachedNotesErrors };
	'drive/files/check-existence': { req: DriveFilesCheckExistenceRequest; res: DriveFilesCheckExistenceResponse; errors: DriveFilesCheckExistenceErrors };
	'drive/files/create': { req: DriveFilesCreateRequest; res: DriveFilesCreateResponse; errors: DriveFilesCreateErrors };
	'drive/files/delete': { req: DriveFilesDeleteRequest; res: EmptyResponse; errors: DriveFilesDeleteErrors };
	'drive/files/find-by-hash': { req: DriveFilesFindByHashRequest; res: DriveFilesFindByHashResponse; errors: DriveFilesFindByHashErrors };
	'drive/files/find': { req: DriveFilesFindRequest; res: DriveFilesFindResponse; errors: DriveFilesFindErrors };
	'drive/files/show': { req: DriveFilesShowRequest; res: DriveFilesShowResponse; errors: DriveFilesShowErrors };
	'drive/files/update': { req: DriveFilesUpdateRequest; res: DriveFilesUpdateResponse; errors: DriveFilesUpdateErrors };
	'drive/files/upload-from-url': { req: DriveFilesUploadFromUrlRequest; res: EmptyResponse; errors: DriveFilesUploadFromUrlErrors };
	'drive/folders': { req: DriveFoldersRequest; res: DriveFoldersResponse; errors: DriveFoldersErrors };
	'drive/folders/create': { req: DriveFoldersCreateRequest; res: DriveFoldersCreateResponse; errors: DriveFoldersCreateErrors };
	'drive/folders/delete': { req: DriveFoldersDeleteRequest; res: EmptyResponse; errors: DriveFoldersDeleteErrors };
	'drive/folders/find': { req: DriveFoldersFindRequest; res: DriveFoldersFindResponse; errors: DriveFoldersFindErrors };
	'drive/folders/show': { req: DriveFoldersShowRequest; res: DriveFoldersShowResponse; errors: DriveFoldersShowErrors };
	'drive/folders/update': { req: DriveFoldersUpdateRequest; res: DriveFoldersUpdateResponse; errors: DriveFoldersUpdateErrors };
	'drive/stream': { req: DriveStreamRequest; res: DriveStreamResponse; errors: DriveStreamErrors };
	'email-address/available': { req: EmailAddressAvailableRequest; res: EmailAddressAvailableResponse; errors: EmailAddressAvailableErrors };
	'endpoint': { req: EndpointRequest; res: EndpointResponse; errors: EndpointErrors };
	'endpoints': { req: EmptyRequest; res: EndpointsResponse; errors: EndpointsErrors };
	'export-custom-emojis': { req: EmptyRequest; res: EmptyResponse; errors: ExportCustomEmojisErrors };
	'federation/followers': { req: FederationFollowersRequest; res: FederationFollowersResponse; errors: FederationFollowersErrors };
	'federation/following': { req: FederationFollowingRequest; res: FederationFollowingResponse; errors: FederationFollowingErrors };
	'federation/instances': { req: FederationInstancesRequest; res: FederationInstancesResponse; errors: FederationInstancesErrors };
	'federation/show-instance': { req: FederationShowInstanceRequest; res: FederationShowInstanceResponse; errors: FederationShowInstanceErrors };
	'federation/update-remote-user': { req: FederationUpdateRemoteUserRequest; res: EmptyResponse; errors: FederationUpdateRemoteUserErrors };
	'federation/users': { req: FederationUsersRequest; res: FederationUsersResponse; errors: FederationUsersErrors };
	'federation/stats': { req: FederationStatsRequest; res: FederationStatsResponse; errors: FederationStatsErrors };
	'following/create': { req: FollowingCreateRequest; res: FollowingCreateResponse; errors: FollowingCreateErrors };
	'following/delete': { req: FollowingDeleteRequest; res: FollowingDeleteResponse; errors: FollowingDeleteErrors };
	'following/update': { req: FollowingUpdateRequest; res: FollowingUpdateResponse; errors: FollowingUpdateErrors };
	'following/update-all': { req: FollowingUpdateAllRequest; res: EmptyResponse; errors: FollowingUpdateAllErrors };
	'following/invalidate': { req: FollowingInvalidateRequest; res: FollowingInvalidateResponse; errors: FollowingInvalidateErrors };
	'following/requests/accept': { req: FollowingRequestsAcceptRequest; res: EmptyResponse; errors: FollowingRequestsAcceptErrors };
	'following/requests/cancel': { req: FollowingRequestsCancelRequest; res: FollowingRequestsCancelResponse; errors: FollowingRequestsCancelErrors };
	'following/requests/list': { req: FollowingRequestsListRequest; res: FollowingRequestsListResponse; errors: FollowingRequestsListErrors };
	'following/requests/reject': { req: FollowingRequestsRejectRequest; res: EmptyResponse; errors: FollowingRequestsRejectErrors };
	'gallery/featured': { req: GalleryFeaturedRequest; res: GalleryFeaturedResponse; errors: GalleryFeaturedErrors };
	'gallery/popular': { req: EmptyRequest; res: GalleryPopularResponse; errors: GalleryPopularErrors };
	'gallery/posts': { req: GalleryPostsRequest; res: GalleryPostsResponse; errors: GalleryPostsErrors };
	'gallery/posts/create': { req: GalleryPostsCreateRequest; res: GalleryPostsCreateResponse; errors: GalleryPostsCreateErrors };
	'gallery/posts/delete': { req: GalleryPostsDeleteRequest; res: EmptyResponse; errors: GalleryPostsDeleteErrors };
	'gallery/posts/like': { req: GalleryPostsLikeRequest; res: EmptyResponse; errors: GalleryPostsLikeErrors };
	'gallery/posts/show': { req: GalleryPostsShowRequest; res: GalleryPostsShowResponse; errors: GalleryPostsShowErrors };
	'gallery/posts/unlike': { req: GalleryPostsUnlikeRequest; res: EmptyResponse; errors: GalleryPostsUnlikeErrors };
	'gallery/posts/update': { req: GalleryPostsUpdateRequest; res: GalleryPostsUpdateResponse; errors: GalleryPostsUpdateErrors };
	'get-online-users-count': { req: EmptyRequest; res: GetOnlineUsersCountResponse; errors: GetOnlineUsersCountErrors };
	'get-avatar-decorations': { req: EmptyRequest; res: GetAvatarDecorationsResponse; errors: GetAvatarDecorationsErrors };
	'hashtags/list': { req: HashtagsListRequest; res: HashtagsListResponse; errors: HashtagsListErrors };
	'hashtags/search': { req: HashtagsSearchRequest; res: HashtagsSearchResponse; errors: HashtagsSearchErrors };
	'hashtags/show': { req: HashtagsShowRequest; res: HashtagsShowResponse; errors: HashtagsShowErrors };
	'hashtags/trend': { req: EmptyRequest; res: HashtagsTrendResponse; errors: HashtagsTrendErrors };
	'hashtags/users': { req: HashtagsUsersRequest; res: HashtagsUsersResponse; errors: HashtagsUsersErrors };
	'i': { req: EmptyRequest; res: IResponse; errors: IErrors };
	'i/2fa/done': { req: I2faDoneRequest; res: I2faDoneResponse; errors: I2faDoneErrors };
	'i/2fa/key-done': { req: I2faKeyDoneRequest; res: I2faKeyDoneResponse; errors: I2faKeyDoneErrors };
	'i/2fa/password-less': { req: I2faPasswordLessRequest; res: EmptyResponse; errors: I2faPasswordLessErrors };
	'i/2fa/register-key': { req: I2faRegisterKeyRequest; res: I2faRegisterKeyResponse; errors: I2faRegisterKeyErrors };
	'i/2fa/register': { req: I2faRegisterRequest; res: I2faRegisterResponse; errors: I2faRegisterErrors };
	'i/2fa/update-key': { req: I2faUpdateKeyRequest; res: EmptyResponse; errors: I2faUpdateKeyErrors };
	'i/2fa/remove-key': { req: I2faRemoveKeyRequest; res: EmptyResponse; errors: I2faRemoveKeyErrors };
	'i/2fa/unregister': { req: I2faUnregisterRequest; res: EmptyResponse; errors: I2faUnregisterErrors };
	'i/apps': { req: IAppsRequest; res: IAppsResponse; errors: IAppsErrors };
	'i/authorized-apps': { req: IAuthorizedAppsRequest; res: IAuthorizedAppsResponse; errors: IAuthorizedAppsErrors };
	'i/claim-achievement': { req: IClaimAchievementRequest; res: EmptyResponse; errors: IClaimAchievementErrors };
	'i/change-password': { req: IChangePasswordRequest; res: EmptyResponse; errors: IChangePasswordErrors };
	'i/delete-account': { req: IDeleteAccountRequest; res: EmptyResponse; errors: IDeleteAccountErrors };
	'i/export-blocking': { req: EmptyRequest; res: EmptyResponse; errors: IExportBlockingErrors };
	'i/export-following': { req: IExportFollowingRequest; res: EmptyResponse; errors: IExportFollowingErrors };
	'i/export-mute': { req: EmptyRequest; res: EmptyResponse; errors: IExportMuteErrors };
	'i/export-notes': { req: EmptyRequest; res: EmptyResponse; errors: IExportNotesErrors };
	'i/export-clips': { req: EmptyRequest; res: EmptyResponse; errors: IExportClipsErrors };
	'i/export-favorites': { req: EmptyRequest; res: EmptyResponse; errors: IExportFavoritesErrors };
	'i/export-user-lists': { req: EmptyRequest; res: EmptyResponse; errors: IExportUserListsErrors };
	'i/export-antennas': { req: EmptyRequest; res: EmptyResponse; errors: IExportAntennasErrors };
	'i/favorites': { req: IFavoritesRequest; res: IFavoritesResponse; errors: IFavoritesErrors };
	'i/gallery/likes': { req: IGalleryLikesRequest; res: IGalleryLikesResponse; errors: IGalleryLikesErrors };
	'i/gallery/posts': { req: IGalleryPostsRequest; res: IGalleryPostsResponse; errors: IGalleryPostsErrors };
	'i/import-blocking': { req: IImportBlockingRequest; res: EmptyResponse; errors: IImportBlockingErrors };
	'i/import-following': { req: IImportFollowingRequest; res: EmptyResponse; errors: IImportFollowingErrors };
	'i/import-muting': { req: IImportMutingRequest; res: EmptyResponse; errors: IImportMutingErrors };
	'i/import-user-lists': { req: IImportUserListsRequest; res: EmptyResponse; errors: IImportUserListsErrors };
	'i/import-antennas': { req: IImportAntennasRequest; res: EmptyResponse; errors: IImportAntennasErrors };
	'i/notifications': { req: INotificationsRequest; res: INotificationsResponse; errors: INotificationsErrors };
	'i/notifications-grouped': { req: INotificationsGroupedRequest; res: INotificationsGroupedResponse; errors: INotificationsGroupedErrors };
	'i/page-likes': { req: IPageLikesRequest; res: IPageLikesResponse; errors: IPageLikesErrors };
	'i/pages': { req: IPagesRequest; res: IPagesResponse; errors: IPagesErrors };
	'i/pin': { req: IPinRequest; res: IPinResponse; errors: IPinErrors };
	'i/read-all-unread-notes': { req: EmptyRequest; res: EmptyResponse; errors: IReadAllUnreadNotesErrors };
	'i/read-announcement': { req: IReadAnnouncementRequest; res: EmptyResponse; errors: IReadAnnouncementErrors };
	'i/regenerate-token': { req: IRegenerateTokenRequest; res: EmptyResponse; errors: IRegenerateTokenErrors };
	'i/registry/get-all': { req: IRegistryGetAllRequest; res: IRegistryGetAllResponse; errors: IRegistryGetAllErrors };
	'i/registry/get-detail': { req: IRegistryGetDetailRequest; res: IRegistryGetDetailResponse; errors: IRegistryGetDetailErrors };
	'i/registry/get': { req: IRegistryGetRequest; res: IRegistryGetResponse; errors: IRegistryGetErrors };
	'i/registry/keys-with-type': { req: IRegistryKeysWithTypeRequest; res: IRegistryKeysWithTypeResponse; errors: IRegistryKeysWithTypeErrors };
	'i/registry/keys': { req: IRegistryKeysRequest; res: IRegistryKeysResponse; errors: IRegistryKeysErrors };
	'i/registry/remove': { req: IRegistryRemoveRequest; res: EmptyResponse; errors: IRegistryRemoveErrors };
	'i/registry/scopes-with-domain': { req: EmptyRequest; res: IRegistryScopesWithDomainResponse; errors: IRegistryScopesWithDomainErrors };
	'i/registry/set': { req: IRegistrySetRequest; res: EmptyResponse; errors: IRegistrySetErrors };
	'i/revoke-token': { req: IRevokeTokenRequest; res: EmptyResponse; errors: IRevokeTokenErrors };
	'i/signin-history': { req: ISigninHistoryRequest; res: ISigninHistoryResponse; errors: ISigninHistoryErrors };
	'i/unpin': { req: IUnpinRequest; res: IUnpinResponse; errors: IUnpinErrors };
	'i/update-email': { req: IUpdateEmailRequest; res: IUpdateEmailResponse; errors: IUpdateEmailErrors };
	'i/update': { req: IUpdateRequest; res: IUpdateResponse; errors: IUpdateErrors };
	'i/move': { req: IMoveRequest; res: IMoveResponse; errors: IMoveErrors };
	'i/webhooks/create': { req: IWebhooksCreateRequest; res: IWebhooksCreateResponse; errors: IWebhooksCreateErrors };
	'i/webhooks/list': { req: EmptyRequest; res: IWebhooksListResponse; errors: IWebhooksListErrors };
	'i/webhooks/show': { req: IWebhooksShowRequest; res: IWebhooksShowResponse; errors: IWebhooksShowErrors };
	'i/webhooks/update': { req: IWebhooksUpdateRequest; res: EmptyResponse; errors: IWebhooksUpdateErrors };
	'i/webhooks/delete': { req: IWebhooksDeleteRequest; res: EmptyResponse; errors: IWebhooksDeleteErrors };
	'i/webhooks/test': { req: IWebhooksTestRequest; res: EmptyResponse; errors: IWebhooksTestErrors };
	'invite/create': { req: EmptyRequest; res: InviteCreateResponse; errors: InviteCreateErrors };
	'invite/delete': { req: InviteDeleteRequest; res: EmptyResponse; errors: InviteDeleteErrors };
	'invite/list': { req: InviteListRequest; res: InviteListResponse; errors: InviteListErrors };
	'invite/limit': { req: EmptyRequest; res: InviteLimitResponse; errors: InviteLimitErrors };
	'meta': { req: MetaRequest; res: MetaResponse; errors: MetaErrors };
	'emojis': { req: EmptyRequest; res: EmojisResponse; errors: EmojisErrors };
	'emoji': { req: EmojiRequest; res: EmojiResponse; errors: EmojiErrors };
	'miauth/gen-token': { req: MiauthGenTokenRequest; res: MiauthGenTokenResponse; errors: MiauthGenTokenErrors };
	'mute/create': { req: MuteCreateRequest; res: EmptyResponse; errors: MuteCreateErrors };
	'mute/delete': { req: MuteDeleteRequest; res: EmptyResponse; errors: MuteDeleteErrors };
	'mute/list': { req: MuteListRequest; res: MuteListResponse; errors: MuteListErrors };
	'renote-mute/create': { req: RenoteMuteCreateRequest; res: EmptyResponse; errors: RenoteMuteCreateErrors };
	'renote-mute/delete': { req: RenoteMuteDeleteRequest; res: EmptyResponse; errors: RenoteMuteDeleteErrors };
	'renote-mute/list': { req: RenoteMuteListRequest; res: RenoteMuteListResponse; errors: RenoteMuteListErrors };
	'my/apps': { req: MyAppsRequest; res: MyAppsResponse; errors: MyAppsErrors };
	'notes': { req: NotesRequest; res: NotesResponse; errors: NotesErrors };
	'notes/children': { req: NotesChildrenRequest; res: NotesChildrenResponse; errors: NotesChildrenErrors };
	'notes/clips': { req: NotesClipsRequest; res: NotesClipsResponse; errors: NotesClipsErrors };
	'notes/conversation': { req: NotesConversationRequest; res: NotesConversationResponse; errors: NotesConversationErrors };
	'notes/create': { req: NotesCreateRequest; res: NotesCreateResponse; errors: NotesCreateErrors };
	'notes/delete': { req: NotesDeleteRequest; res: EmptyResponse; errors: NotesDeleteErrors };
	'notes/favorites/create': { req: NotesFavoritesCreateRequest; res: EmptyResponse; errors: NotesFavoritesCreateErrors };
	'notes/favorites/delete': { req: NotesFavoritesDeleteRequest; res: EmptyResponse; errors: NotesFavoritesDeleteErrors };
	'notes/featured': { req: NotesFeaturedRequest; res: NotesFeaturedResponse; errors: NotesFeaturedErrors };
	'notes/global-timeline': { req: NotesGlobalTimelineRequest; res: NotesGlobalTimelineResponse; errors: NotesGlobalTimelineErrors };
	'notes/hybrid-timeline': { req: NotesHybridTimelineRequest; res: NotesHybridTimelineResponse; errors: NotesHybridTimelineErrors };
	'notes/local-timeline': { req: NotesLocalTimelineRequest; res: NotesLocalTimelineResponse; errors: NotesLocalTimelineErrors };
	'notes/mentions': { req: NotesMentionsRequest; res: NotesMentionsResponse; errors: NotesMentionsErrors };
	'notes/polls/recommendation': { req: NotesPollsRecommendationRequest; res: NotesPollsRecommendationResponse; errors: NotesPollsRecommendationErrors };
	'notes/polls/vote': { req: NotesPollsVoteRequest; res: EmptyResponse; errors: NotesPollsVoteErrors };
	'notes/reactions': { req: NotesReactionsRequest; res: NotesReactionsResponse; errors: NotesReactionsErrors };
	'notes/reactions/create': { req: NotesReactionsCreateRequest; res: EmptyResponse; errors: NotesReactionsCreateErrors };
	'notes/reactions/delete': { req: NotesReactionsDeleteRequest; res: EmptyResponse; errors: NotesReactionsDeleteErrors };
	'notes/renotes': { req: NotesRenotesRequest; res: NotesRenotesResponse; errors: NotesRenotesErrors };
	'notes/replies': { req: NotesRepliesRequest; res: NotesRepliesResponse; errors: NotesRepliesErrors };
	'notes/search-by-tag': { req: NotesSearchByTagRequest; res: NotesSearchByTagResponse; errors: NotesSearchByTagErrors };
	'notes/search': { req: NotesSearchRequest; res: NotesSearchResponse; errors: NotesSearchErrors };
	'notes/show': { req: NotesShowRequest; res: NotesShowResponse; errors: NotesShowErrors };
	'notes/state': { req: NotesStateRequest; res: NotesStateResponse; errors: NotesStateErrors };
	'notes/thread-muting/create': { req: NotesThreadMutingCreateRequest; res: EmptyResponse; errors: NotesThreadMutingCreateErrors };
	'notes/thread-muting/delete': { req: NotesThreadMutingDeleteRequest; res: EmptyResponse; errors: NotesThreadMutingDeleteErrors };
	'notes/timeline': { req: NotesTimelineRequest; res: NotesTimelineResponse; errors: NotesTimelineErrors };
	'notes/translate': { req: NotesTranslateRequest; res: NotesTranslateResponse; errors: NotesTranslateErrors };
	'notes/unrenote': { req: NotesUnrenoteRequest; res: EmptyResponse; errors: NotesUnrenoteErrors };
	'notes/user-list-timeline': { req: NotesUserListTimelineRequest; res: NotesUserListTimelineResponse; errors: NotesUserListTimelineErrors };
	'notifications/create': { req: NotificationsCreateRequest; res: EmptyResponse; errors: NotificationsCreateErrors };
	'notifications/flush': { req: EmptyRequest; res: EmptyResponse; errors: NotificationsFlushErrors };
	'notifications/mark-all-as-read': { req: EmptyRequest; res: EmptyResponse; errors: NotificationsMarkAllAsReadErrors };
	'notifications/test-notification': { req: EmptyRequest; res: EmptyResponse; errors: NotificationsTestNotificationErrors };
	'page-push': { req: PagePushRequest; res: EmptyResponse; errors: PagePushErrors };
	'pages/create': { req: PagesCreateRequest; res: PagesCreateResponse; errors: PagesCreateErrors };
	'pages/delete': { req: PagesDeleteRequest; res: EmptyResponse; errors: PagesDeleteErrors };
	'pages/featured': { req: EmptyRequest; res: PagesFeaturedResponse; errors: PagesFeaturedErrors };
	'pages/like': { req: PagesLikeRequest; res: EmptyResponse; errors: PagesLikeErrors };
	'pages/show': { req: PagesShowRequest; res: PagesShowResponse; errors: PagesShowErrors };
	'pages/unlike': { req: PagesUnlikeRequest; res: EmptyResponse; errors: PagesUnlikeErrors };
	'pages/update': { req: PagesUpdateRequest; res: EmptyResponse; errors: PagesUpdateErrors };
	'flash/create': { req: FlashCreateRequest; res: FlashCreateResponse; errors: FlashCreateErrors };
	'flash/delete': { req: FlashDeleteRequest; res: EmptyResponse; errors: FlashDeleteErrors };
	'flash/featured': { req: FlashFeaturedRequest; res: FlashFeaturedResponse; errors: FlashFeaturedErrors };
	'flash/like': { req: FlashLikeRequest; res: EmptyResponse; errors: FlashLikeErrors };
	'flash/show': { req: FlashShowRequest; res: FlashShowResponse; errors: FlashShowErrors };
	'flash/unlike': { req: FlashUnlikeRequest; res: EmptyResponse; errors: FlashUnlikeErrors };
	'flash/update': { req: FlashUpdateRequest; res: EmptyResponse; errors: FlashUpdateErrors };
	'flash/my': { req: FlashMyRequest; res: FlashMyResponse; errors: FlashMyErrors };
	'flash/my-likes': { req: FlashMyLikesRequest; res: FlashMyLikesResponse; errors: FlashMyLikesErrors };
	'ping': { req: EmptyRequest; res: PingResponse; errors: PingErrors };
	'pinned-users': { req: EmptyRequest; res: PinnedUsersResponse; errors: PinnedUsersErrors };
	'promo/read': { req: PromoReadRequest; res: EmptyResponse; errors: PromoReadErrors };
	'roles/list': { req: EmptyRequest; res: RolesListResponse; errors: RolesListErrors };
	'roles/show': { req: RolesShowRequest; res: RolesShowResponse; errors: RolesShowErrors };
	'roles/users': { req: RolesUsersRequest; res: RolesUsersResponse; errors: RolesUsersErrors };
	'roles/notes': { req: RolesNotesRequest; res: RolesNotesResponse; errors: RolesNotesErrors };
	'request-reset-password': { req: RequestResetPasswordRequest; res: EmptyResponse; errors: RequestResetPasswordErrors };
	'reset-db': { req: EmptyRequest; res: EmptyResponse; errors: ResetDbErrors };
	'reset-password': { req: ResetPasswordRequest; res: EmptyResponse; errors: ResetPasswordErrors };
	'server-info': { req: EmptyRequest; res: ServerInfoResponse; errors: ServerInfoErrors };
	'stats': { req: EmptyRequest; res: StatsResponse; errors: StatsErrors };
	'sw/show-registration': { req: SwShowRegistrationRequest; res: SwShowRegistrationResponse; errors: SwShowRegistrationErrors };
	'sw/update-registration': { req: SwUpdateRegistrationRequest; res: SwUpdateRegistrationResponse; errors: SwUpdateRegistrationErrors };
	'sw/register': { req: SwRegisterRequest; res: SwRegisterResponse; errors: SwRegisterErrors };
	'sw/unregister': { req: SwUnregisterRequest; res: EmptyResponse; errors: SwUnregisterErrors };
	'test': { req: TestRequest; res: TestResponse; errors: TestErrors };
	'username/available': { req: UsernameAvailableRequest; res: UsernameAvailableResponse; errors: UsernameAvailableErrors };
	'users': { req: UsersRequest; res: UsersResponse; errors: UsersErrors };
	'users/clips': { req: UsersClipsRequest; res: UsersClipsResponse; errors: UsersClipsErrors };
	'users/followers': { req: UsersFollowersRequest; res: UsersFollowersResponse; errors: UsersFollowersErrors };
	'users/following': { req: UsersFollowingRequest; res: UsersFollowingResponse; errors: UsersFollowingErrors };
	'users/gallery/posts': { req: UsersGalleryPostsRequest; res: UsersGalleryPostsResponse; errors: UsersGalleryPostsErrors };
	'users/get-frequently-replied-users': { req: UsersGetFrequentlyRepliedUsersRequest; res: UsersGetFrequentlyRepliedUsersResponse; errors: UsersGetFrequentlyRepliedUsersErrors };
	'users/featured-notes': { req: UsersFeaturedNotesRequest; res: UsersFeaturedNotesResponse; errors: UsersFeaturedNotesErrors };
	'users/lists/create': { req: UsersListsCreateRequest; res: UsersListsCreateResponse; errors: UsersListsCreateErrors };
	'users/lists/delete': { req: UsersListsDeleteRequest; res: EmptyResponse; errors: UsersListsDeleteErrors };
	'users/lists/list': { req: UsersListsListRequest; res: UsersListsListResponse; errors: UsersListsListErrors };
	'users/lists/pull': { req: UsersListsPullRequest; res: EmptyResponse; errors: UsersListsPullErrors };
	'users/lists/push': { req: UsersListsPushRequest; res: EmptyResponse; errors: UsersListsPushErrors };
	'users/lists/show': { req: UsersListsShowRequest; res: UsersListsShowResponse; errors: UsersListsShowErrors };
	'users/lists/favorite': { req: UsersListsFavoriteRequest; res: EmptyResponse; errors: UsersListsFavoriteErrors };
	'users/lists/unfavorite': { req: UsersListsUnfavoriteRequest; res: EmptyResponse; errors: UsersListsUnfavoriteErrors };
	'users/lists/update': { req: UsersListsUpdateRequest; res: UsersListsUpdateResponse; errors: UsersListsUpdateErrors };
	'users/lists/create-from-public': { req: UsersListsCreateFromPublicRequest; res: UsersListsCreateFromPublicResponse; errors: UsersListsCreateFromPublicErrors };
	'users/lists/update-membership': { req: UsersListsUpdateMembershipRequest; res: EmptyResponse; errors: UsersListsUpdateMembershipErrors };
	'users/lists/get-memberships': { req: UsersListsGetMembershipsRequest; res: UsersListsGetMembershipsResponse; errors: UsersListsGetMembershipsErrors };
	'users/notes': { req: UsersNotesRequest; res: UsersNotesResponse; errors: UsersNotesErrors };
	'users/pages': { req: UsersPagesRequest; res: UsersPagesResponse; errors: UsersPagesErrors };
	'users/flashs': { req: UsersFlashsRequest; res: UsersFlashsResponse; errors: UsersFlashsErrors };
	'users/reactions': { req: UsersReactionsRequest; res: UsersReactionsResponse; errors: UsersReactionsErrors };
	'users/recommendation': { req: UsersRecommendationRequest; res: UsersRecommendationResponse; errors: UsersRecommendationErrors };
	'users/relation': { req: UsersRelationRequest; res: UsersRelationResponse; errors: UsersRelationErrors };
	'users/report-abuse': { req: UsersReportAbuseRequest; res: EmptyResponse; errors: UsersReportAbuseErrors };
	'users/search-by-username-and-host': { req: UsersSearchByUsernameAndHostRequest; res: UsersSearchByUsernameAndHostResponse; errors: UsersSearchByUsernameAndHostErrors };
	'users/search': { req: UsersSearchRequest; res: UsersSearchResponse; errors: UsersSearchErrors };
	'users/show': { req: UsersShowRequest; res: UsersShowResponse; errors: UsersShowErrors };
	'users/achievements': { req: UsersAchievementsRequest; res: UsersAchievementsResponse; errors: UsersAchievementsErrors };
	'users/update-memo': { req: UsersUpdateMemoRequest; res: EmptyResponse; errors: UsersUpdateMemoErrors };
	'fetch-rss': { req: FetchRssRequest; res: FetchRssResponse; errors: FetchRssErrors };
	'fetch-external-resources': { req: FetchExternalResourcesRequest; res: FetchExternalResourcesResponse; errors: FetchExternalResourcesErrors };
	'retention': { req: EmptyRequest; res: RetentionResponse; errors: RetentionErrors };
	'bubble-game/register': { req: BubbleGameRegisterRequest; res: EmptyResponse; errors: BubbleGameRegisterErrors };
	'bubble-game/ranking': { req: BubbleGameRankingRequest; res: BubbleGameRankingResponse; errors: BubbleGameRankingErrors };
	'reversi/cancel-match': { req: ReversiCancelMatchRequest; res: EmptyResponse; errors: ReversiCancelMatchErrors };
	'reversi/games': { req: ReversiGamesRequest; res: ReversiGamesResponse; errors: ReversiGamesErrors };
	'reversi/match': { req: ReversiMatchRequest; res: ReversiMatchResponse; errors: ReversiMatchErrors };
	'reversi/invitations': { req: EmptyRequest; res: ReversiInvitationsResponse; errors: ReversiInvitationsErrors };
	'reversi/show-game': { req: ReversiShowGameRequest; res: ReversiShowGameResponse; errors: ReversiShowGameErrors };
	'reversi/surrender': { req: ReversiSurrenderRequest; res: EmptyResponse; errors: ReversiSurrenderErrors };
	'reversi/verify': { req: ReversiVerifyRequest; res: ReversiVerifyResponse; errors: ReversiVerifyErrors };
}

/**
 * NOTE: The content-type for all endpoints not listed here is application/json.
 */
export const endpointReqTypes = {
	'drive/files/create': 'multipart/form-data',
} as const satisfies { [K in keyof Endpoints]?: 'multipart/form-data'; };
