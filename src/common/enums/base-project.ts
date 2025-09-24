export enum projectEnvironment {
  Development = 'development',
  Testing = 'testing',
  Production = 'production',
}

export enum projectWorker {
  Api = 'api',
  Microservices = 'microservices',
}

export enum projectTelemetry {
  Host = 'host',
  Api = 'api',
  Io = 'io',
  Repo = 'repo',
  Job = 'job',
}
export enum projectCookie {
  AccessToken = 'project_access_token',
  AuthType = 'project_auth_type',
  IsAuthenticated = 'project_is_authenticated',
  SharedLinkToken = 'project_shared_link_token',
  OAuthState = 'project_oauth_state',
  OAuthCodeVerifier = 'project_oauth_code_verifier',
}

export enum projectHeader {
  ApiKey = 'x-api-key',
  UserToken = 'x-project-user-token',
  SessionToken = 'x-project-session-token',
  SharedLinkKey = 'x-project-share-key',
  SharedLinkSlug = 'x-project-share-slug',
  Checksum = 'x-project-checksum',
  Cid = 'x-project-cid',
}
