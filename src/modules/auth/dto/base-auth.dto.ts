
export class AuthDto {
  user!: AuthUser;

  apiKey?: AuthApiKey;
  sharedLink?: AuthSharedLink;
  session?: AuthSession;
}
export type AuthApiKey = {
  id: string;
  roles: string[];
};
export type AuthUser = {
  id: string;
  isAdmin: boolean;
  name: string;
  email: string;
  roles: string[];
  quotaUsageInBytes: number;
  quotaSizeInBytes: number | null;
};
export type AuthSharedLink = {
  id: string;
  expiresAt: Date | null;
  userId: string;
  showExif: boolean;
  allowUpload: boolean;
  allowDownload: boolean;
  password: string | null;
};
export type AuthSession = {
  id: string;
  hasElevatedPermission: boolean;
};
