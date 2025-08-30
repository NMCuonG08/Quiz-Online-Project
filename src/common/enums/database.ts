export enum DatabaseExtension {
  Cube = 'cube',
  EarthDistance = 'earthdistance',
  Vector = 'vector',
  Vectors = 'vectors',
  VectorChord = 'vchord',
}
export enum ExifOrientation {
  Horizontal = 1,
  MirrorHorizontal = 2,
  Rotate180 = 3,
  MirrorVertical = 4,
  MirrorHorizontalRotate270CW = 5,
  Rotate90CW = 6,
  MirrorHorizontalRotate90CW = 7,
  Rotate270CW = 8,
}
export enum VectorIndex {
  Clip = 'clip_index',
  Face = 'face_index',
}
export enum DatabaseEnvironment {
  Development = 'development',
  Testing = 'testing',
  Production = 'production',
}
export enum DatabaseSslMode {
  Disable = 'disable',
  Allow = 'allow',
  Prefer = 'prefer',
  Require = 'require',
  VerifyFull = 'verify-full',
}

export enum LogLevel {
  Verbose = 'verbose',
  Debug = 'debug',
  Log = 'log',
  Warn = 'warn',
  Error = 'error',
  Fatal = 'fatal',
}
export enum QueueName {
  ThumbnailGeneration = 'thumbnailGeneration',
  MetadataExtraction = 'metadataExtraction',
  VideoConversion = 'videoConversion',
  FaceDetection = 'faceDetection',
  FacialRecognition = 'facialRecognition',
  SmartSearch = 'smartSearch',
  DuplicateDetection = 'duplicateDetection',
  BackgroundTask = 'backgroundTask',
  StorageTemplateMigration = 'storageTemplateMigration',
  Migration = 'migration',
  Search = 'search',
  Sidecar = 'sidecar',
  Library = 'library',
  Notification = 'notifications',
  BackupDatabase = 'backupDatabase',
}
