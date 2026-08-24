INSERT INTO "public"."role_permissions" ("roleId", "permissionId")
SELECT role_row."id", permission_row."id"
FROM "public"."roles" AS role_row
CROSS JOIN "public"."permissions" AS permission_row
WHERE role_row."name" = 'user'
  AND permission_row."key" IN (
    'quiz.create',
    'quiz.update',
    'quiz.delete',
    'quiz.statistics'
  )
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
