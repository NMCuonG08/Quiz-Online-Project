import { VECTOR_EXTENSIONS } from '@/common/constants';
import { DatabaseSslMode } from '@/common/enums';

export type DatabaseConnectionURL = {
  connectionType: 'url';
  url: string;
};
export type DatabaseConnectionParts = {
  connectionType: 'parts';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl?: DatabaseSslMode;
};

export type DatabaseConnectionParams =
  | DatabaseConnectionURL
  | DatabaseConnectionParts;
export type VectorExtension = (typeof VECTOR_EXTENSIONS)[number];
