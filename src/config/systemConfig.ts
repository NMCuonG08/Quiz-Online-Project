import { CronExpression } from '@nestjs/schedule';
import {
  LogLevel,
  OAuthTokenEndpointAuthMethod,
  QueueName,
} from '@/common/enums';
import { ConcurrentQueueName } from '@/common/types';

export interface SystemConfig {
  backup: {
    database: {
      enabled: boolean;
      cronExpression: string;
      keepLastAmount: number;
    };
  };

  job: Record<ConcurrentQueueName, { concurrency: number }>;
  logging: {
    enabled: boolean;
    level: LogLevel;
  };

  map: {
    enabled: boolean;
    lightStyle: string;
    darkStyle: string;
  };
  reverseGeocoding: {
    enabled: boolean;
  };
  metadata: {
    faces: {
      import: boolean;
    };
  };
  oauth: {
    autoLaunch: boolean;
    autoRegister: boolean;
    buttonText: string;
    clientId: string;
    clientSecret: string;
    defaultStorageQuota: number | null;
    enabled: boolean;
    issuerUrl: string;
    mobileOverrideEnabled: boolean;
    mobileRedirectUri: string;
    scope: string;
    signingAlgorithm: string;
    profileSigningAlgorithm: string;
    tokenEndpointAuthMethod: OAuthTokenEndpointAuthMethod;
    timeout: number;
    storageLabelClaim: string;
    storageQuotaClaim: string;
    roleClaim: string;
  };
  passwordLogin: {
    enabled: boolean;
  };

  newVersionCheck: {
    enabled: boolean;
  };
  nightlyTasks: {
    startTime: string;
    databaseCleanup: boolean;
    missingThumbnails: boolean;
    clusterNewFaces: boolean;
    generateMemories: boolean;
    syncQuotaUsage: boolean;
  };
  trash: {
    enabled: boolean;
    days: number;
  };
  theme: {
    customCss: string;
  };

  //   notifications: {
  //     smtp: {
  //       enabled: boolean;
  //       from: string;
  //       replyTo: string;
  //       transport: {
  //         ignoreCert: boolean;
  //         host: string;
  //         port: number;
  //         username: string;
  //         password: string;
  //       };
  //     };
  //   };

  server: {
    externalDomain: string;
    loginPageMessage: string;
    publicUsers: boolean;
  };
  user: {
    deleteDelay: number;
  };
}

export const defaults = Object.freeze<SystemConfig>({
  backup: {
    database: {
      enabled: true,
      cronExpression: CronExpression.EVERY_DAY_AT_2AM,
      keepLastAmount: 14,
    },
  },

  job: {
    [QueueName.BackgroundTask]: { concurrency: 5 },
    [QueueName.SmartSearch]: { concurrency: 2 },
    [QueueName.MetadataExtraction]: { concurrency: 5 },
    [QueueName.FaceDetection]: { concurrency: 2 },
    [QueueName.Search]: { concurrency: 5 },
    [QueueName.Sidecar]: { concurrency: 5 },
    [QueueName.Library]: { concurrency: 5 },
    [QueueName.Migration]: { concurrency: 5 },
    [QueueName.ThumbnailGeneration]: { concurrency: 3 },
    [QueueName.VideoConversion]: { concurrency: 1 },
    [QueueName.Notification]: { concurrency: 5 },
  },
  logging: {
    enabled: true,
    level: LogLevel.Log,
  },

  map: {
    enabled: true,
    lightStyle: 'https://tiles.immich.cloud/v1/style/light.json',
    darkStyle: 'https://tiles.immich.cloud/v1/style/dark.json',
  },
  reverseGeocoding: {
    enabled: true,
  },
  metadata: {
    faces: {
      import: false,
    },
  },
  oauth: {
    autoLaunch: false,
    autoRegister: true,
    buttonText: 'Login with OAuth',
    clientId: '',
    clientSecret: '',
    defaultStorageQuota: null,
    enabled: false,
    issuerUrl: '',
    mobileOverrideEnabled: false,
    mobileRedirectUri: '',
    scope: 'openid email profile',
    signingAlgorithm: 'RS256',
    profileSigningAlgorithm: 'none',
    storageLabelClaim: 'preferred_username',
    storageQuotaClaim: 'immich_quota',
    roleClaim: 'immich_role',
    tokenEndpointAuthMethod: OAuthTokenEndpointAuthMethod.ClientSecretPost,
    timeout: 30_000,
  },
  passwordLogin: {
    enabled: true,
  },

  newVersionCheck: {
    enabled: true,
  },
  nightlyTasks: {
    startTime: '00:00',
    databaseCleanup: true,
    generateMemories: true,
    syncQuotaUsage: true,
    missingThumbnails: true,
    clusterNewFaces: true,
  },
  trash: {
    enabled: true,
    days: 30,
  },
  theme: {
    customCss: '',
  },

  server: {
    externalDomain: '',
    loginPageMessage: '',
    publicUsers: true,
  },

  user: {
    deleteDelay: 7,
  },
});
