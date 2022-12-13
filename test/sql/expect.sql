CREATE TABLE "Identifier" (
  "id" bigint generated always as identity,
  "categoryId" bigint NULL,
  "storage" varchar NOT NULL DEFAULT 'master',
  "status" varchar NOT NULL DEFAULT 'actual',
  "creation" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "change" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lock" boolean NOT NULL DEFAULT false,
  "version" integer NOT NULL DEFAULT 0,
  "hashsum" varchar NOT NULL DEFAULT ''
);

ALTER TABLE "Identifier" ADD CONSTRAINT "pkIdentifier" PRIMARY KEY ("id");
ALTER TABLE "Identifier" ADD CONSTRAINT "fkIdentifierCategory" FOREIGN KEY ("categoryId") REFERENCES "Identifier" ("id");
CREATE INDEX "idxIdentifierStorage" ON "Identifier" ("storage");
CREATE INDEX "idxIdentifierStatus" ON "Identifier" ("status");

CREATE TABLE "Unit" (
  "id" bigint NOT NULL,
  "name" varchar NOT NULL,
  "parentId" bigint NULL
);

ALTER TABLE "Unit" ADD CONSTRAINT "pkUnit" PRIMARY KEY ("id");
ALTER TABLE "Unit" ADD CONSTRAINT "fkUnitId" FOREIGN KEY ("id") REFERENCES "Identifier" ("id");
CREATE UNIQUE INDEX "akUnitName" ON "Unit" ("name");
ALTER TABLE "Unit" ADD CONSTRAINT "fkUnitParent" FOREIGN KEY ("parentId") REFERENCES "Unit" ("id");

CREATE TABLE "Role" (
  "roleId" bigint generated always as identity,
  "name" varchar NOT NULL,
  "active" boolean NOT NULL DEFAULT true,
  "unitId" bigint NOT NULL
);

ALTER TABLE "Role" ADD CONSTRAINT "pkRole" PRIMARY KEY ("roleId");
CREATE UNIQUE INDEX "akRoleName" ON "Role" ("name");
ALTER TABLE "Role" ADD CONSTRAINT "fkRoleUnit" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE RESTRICT;

CREATE TABLE "Account" (
  "id" bigint NOT NULL,
  "login" varchar(64) NOT NULL,
  "password" varchar NOT NULL,
  "active" boolean NOT NULL DEFAULT true,
  "email" varchar(255) NOT NULL,
  "phone" varchar(15) NOT NULL,
  "fullNameGiven" varchar NULL,
  "fullNameMiddle" varchar NULL,
  "fullNameSurname" varchar NULL
);

ALTER TABLE "Account" ADD CONSTRAINT "pkAccount" PRIMARY KEY ("id");
ALTER TABLE "Account" ADD CONSTRAINT "fkAccountId" FOREIGN KEY ("id") REFERENCES "Identifier" ("id");
CREATE UNIQUE INDEX "akAccountLogin" ON "Account" ("login");
CREATE UNIQUE INDEX "akAccountEmail" ON "Account" ("email");
CREATE UNIQUE INDEX "akAccountPhone" ON "Account" ("phone");

CREATE TABLE "AccountUnit" (
  "accountId" bigint NOT NULL,
  "unitId" bigint NOT NULL
);

ALTER TABLE "AccountUnit" ADD CONSTRAINT "pkAccountUnit" PRIMARY KEY ("accountId", "unitId");
ALTER TABLE "AccountUnit" ADD CONSTRAINT "fkAccountUnitAccount" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE;
ALTER TABLE "AccountUnit" ADD CONSTRAINT "fkAccountUnitUnit" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE CASCADE;

CREATE TABLE "AccountRole" (
  "accountId" bigint NOT NULL,
  "roleId" bigint NOT NULL
);

ALTER TABLE "AccountRole" ADD CONSTRAINT "pkAccountRole" PRIMARY KEY ("accountId", "roleId");
ALTER TABLE "AccountRole" ADD CONSTRAINT "fkAccountRoleAccount" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE;
ALTER TABLE "AccountRole" ADD CONSTRAINT "fkAccountRoleRole" FOREIGN KEY ("roleId") REFERENCES "Role" ("roleId") ON DELETE CASCADE;

CREATE TABLE "Catalog" (
  "id" bigint NOT NULL,
  "parentId" bigint NULL,
  "name" varchar NOT NULL
);

ALTER TABLE "Catalog" ADD CONSTRAINT "pkCatalog" PRIMARY KEY ("id");
ALTER TABLE "Catalog" ADD CONSTRAINT "fkCatalogId" FOREIGN KEY ("id") REFERENCES "Identifier" ("id");
ALTER TABLE "Catalog" ADD CONSTRAINT "fkCatalogParent" FOREIGN KEY ("parentId") REFERENCES "Catalog" ("id");
CREATE INDEX "idxCatalogName" ON "Catalog" ("name");

CREATE TABLE "CatalogIdentifier" (
  "catalogId" bigint NOT NULL,
  "identifierId" bigint NOT NULL
);

ALTER TABLE "CatalogIdentifier" ADD CONSTRAINT "pkCatalogIdentifier" PRIMARY KEY ("catalogId", "identifierId");
ALTER TABLE "CatalogIdentifier" ADD CONSTRAINT "fkCatalogIdentifierCatalog" FOREIGN KEY ("catalogId") REFERENCES "Catalog" ("id") ON DELETE CASCADE;
ALTER TABLE "CatalogIdentifier" ADD CONSTRAINT "fkCatalogIdentifierIdentifier" FOREIGN KEY ("identifierId") REFERENCES "Identifier" ("id") ON DELETE CASCADE;
CREATE UNIQUE INDEX "akCatalogNaturalKey" ON "Catalog" ("parentId", "name");

CREATE TABLE "Category" (
  "id" bigint NOT NULL,
  "name" varchar NOT NULL,
  "kind" varchar NOT NULL DEFAULT 'entity',
  "scope" varchar NOT NULL DEFAULT 'system',
  "store" varchar NOT NULL DEFAULT 'persistent',
  "allow" varchar NOT NULL DEFAULT 'write'
);

ALTER TABLE "Category" ADD CONSTRAINT "pkCategory" PRIMARY KEY ("id");
ALTER TABLE "Category" ADD CONSTRAINT "fkCategoryId" FOREIGN KEY ("id") REFERENCES "Identifier" ("id");
CREATE UNIQUE INDEX "akCategoryName" ON "Category" ("name");

CREATE TABLE "Config" (
  "configId" bigint generated always as identity,
  "name" varchar NOT NULL,
  "data" jsonb NOT NULL
);

ALTER TABLE "Config" ADD CONSTRAINT "pkConfig" PRIMARY KEY ("configId");
CREATE UNIQUE INDEX "akConfigName" ON "Config" ("name");

CREATE TABLE "Session" (
  "sessionId" bigint generated always as identity,
  "accountId" bigint NOT NULL,
  "token" varchar NOT NULL,
  "ip" inet NOT NULL,
  "data" jsonb NOT NULL
);

ALTER TABLE "Session" ADD CONSTRAINT "pkSession" PRIMARY KEY ("sessionId");
ALTER TABLE "Session" ADD CONSTRAINT "fkSessionAccount" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE;
CREATE UNIQUE INDEX "akSessionToken" ON "Session" ("token");

CREATE TABLE "Cursor" (
  "cursorId" bigint generated always as identity,
  "sessionId" bigint NOT NULL,
  "hashsum" varchar NOT NULL,
  "created" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "query" jsonb NOT NULL,
  "version" integer NOT NULL DEFAULT 0
);

ALTER TABLE "Cursor" ADD CONSTRAINT "pkCursor" PRIMARY KEY ("cursorId");
ALTER TABLE "Cursor" ADD CONSTRAINT "fkCursorSession" FOREIGN KEY ("sessionId") REFERENCES "Session" ("sessionId") ON DELETE CASCADE;

CREATE TABLE "Field" (
  "id" bigint NOT NULL,
  "categoryId" bigint NOT NULL,
  "name" varchar NOT NULL
);

ALTER TABLE "Field" ADD CONSTRAINT "pkField" PRIMARY KEY ("id");
ALTER TABLE "Field" ADD CONSTRAINT "fkFieldId" FOREIGN KEY ("id") REFERENCES "Identifier" ("id");
ALTER TABLE "Field" ADD CONSTRAINT "fkFieldCategory" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE;
CREATE UNIQUE INDEX "akFieldNaturalKey" ON "Field" ("categoryId", "name");

CREATE TABLE "File" (
  "id" bigint NOT NULL,
  "filename" varchar NOT NULL,
  "crc32" varchar NOT NULL,
  "hashsum" varchar NOT NULL,
  "size" integer NOT NULL,
  "mediaType" varchar NOT NULL,
  "accessLast" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "accessCount" integer NOT NULL DEFAULT 0,
  "compressionFormat" varchar NOT NULL,
  "compressionSize" integer NOT NULL
);

ALTER TABLE "File" ADD CONSTRAINT "pkFile" PRIMARY KEY ("id");
ALTER TABLE "File" ADD CONSTRAINT "fkFileId" FOREIGN KEY ("id") REFERENCES "Identifier" ("id");
CREATE INDEX "idxFileFilename" ON "File" ("filename");
CREATE INDEX "idxFileCrc32" ON "File" ("crc32");

CREATE TABLE "Server" (
  "id" bigint NOT NULL,
  "name" varchar NOT NULL,
  "suffix" varchar NOT NULL,
  "ip" inet NOT NULL,
  "kind" varchar NOT NULL DEFAULT 'server',
  "ports" jsonb NOT NULL
);

ALTER TABLE "Server" ADD CONSTRAINT "pkServer" PRIMARY KEY ("id");
ALTER TABLE "Server" ADD CONSTRAINT "fkServerId" FOREIGN KEY ("id") REFERENCES "Identifier" ("id");
CREATE UNIQUE INDEX "akServerName" ON "Server" ("name");
CREATE UNIQUE INDEX "akServerSuffix" ON "Server" ("suffix");
CREATE UNIQUE INDEX "akServerIp" ON "Server" ("ip");

CREATE TABLE "Journal" (
  "journalId" bigint generated always as identity,
  "identifierId" bigint NOT NULL,
  "accountId" bigint NOT NULL,
  "serverId" bigint NOT NULL,
  "action" varchar NOT NULL,
  "dateTime" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ip" inet NOT NULL,
  "details" jsonb NOT NULL
);

ALTER TABLE "Journal" ADD CONSTRAINT "pkJournal" PRIMARY KEY ("journalId");
ALTER TABLE "Journal" ADD CONSTRAINT "fkJournalIdentifier" FOREIGN KEY ("identifierId") REFERENCES "Identifier" ("id");
ALTER TABLE "Journal" ADD CONSTRAINT "fkJournalAccount" FOREIGN KEY ("accountId") REFERENCES "Account" ("id");
ALTER TABLE "Journal" ADD CONSTRAINT "fkJournalServer" FOREIGN KEY ("serverId") REFERENCES "Server" ("id");

CREATE TABLE "Locking" (
  "lockingId" bigint generated always as identity,
  "identifierId" bigint NOT NULL,
  "sessionId" bigint NOT NULL,
  "request" timestamp with time zone NOT NULL,
  "start" timestamp with time zone NOT NULL,
  "expire" timestamp with time zone NOT NULL,
  "updates" integer NOT NULL DEFAULT 0
);

ALTER TABLE "Locking" ADD CONSTRAINT "pkLocking" PRIMARY KEY ("lockingId");
ALTER TABLE "Locking" ADD CONSTRAINT "fkLockingIdentifier" FOREIGN KEY ("identifierId") REFERENCES "Identifier" ("id");
ALTER TABLE "Locking" ADD CONSTRAINT "fkLockingSession" FOREIGN KEY ("sessionId") REFERENCES "Session" ("sessionId");
CREATE INDEX "idxLockingRequest" ON "Locking" ("request");
CREATE INDEX "idxLockingStart" ON "Locking" ("start");
CREATE INDEX "idxLockingExpire" ON "Locking" ("expire");

CREATE TABLE "Permission" (
  "permissionId" bigint generated always as identity,
  "roleId" bigint NOT NULL,
  "identifierId" bigint NOT NULL,
  "action" varchar NOT NULL DEFAULT 'update'
);

ALTER TABLE "Permission" ADD CONSTRAINT "pkPermission" PRIMARY KEY ("permissionId");
ALTER TABLE "Permission" ADD CONSTRAINT "fkPermissionRole" FOREIGN KEY ("roleId") REFERENCES "Role" ("roleId") ON DELETE CASCADE;
ALTER TABLE "Permission" ADD CONSTRAINT "fkPermissionIdentifier" FOREIGN KEY ("identifierId") REFERENCES "Identifier" ("id") ON DELETE CASCADE;
CREATE UNIQUE INDEX "akPermissionNaturalKey" ON "Permission" ("roleId", "identifierId");

INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Category" ("id", "name", "kind") VALUES (lastval(), 'Identifier', 'entity');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Identifier'), 'category');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Identifier'), 'storage');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Identifier'), 'status');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Identifier'), 'creation');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Identifier'), 'change');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Identifier'), 'lock');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Identifier'), 'version');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Identifier'), 'hashsum');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Category" ("id", "name", "kind") VALUES (lastval(), 'Unit', 'registry');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Unit'), 'name');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Unit'), 'parent');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Category" ("id", "name", "kind") VALUES (lastval(), 'Role', 'entity');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Role'), 'name');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Role'), 'active');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Role'), 'unit');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Category" ("id", "name", "kind") VALUES (lastval(), 'Account', 'registry');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Account'), 'login');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Account'), 'password');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Account'), 'active');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Account'), 'email');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Account'), 'phone');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Account'), 'fullNameGiven');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Account'), 'fullNameMiddle');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Account'), 'fullNameSurname');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Category" ("id", "name", "kind") VALUES (lastval(), 'Catalog', 'registry');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Catalog'), 'parent');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Catalog'), 'name');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Category" ("id", "name", "kind") VALUES (lastval(), 'Category', 'registry');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Category'), 'name');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Category'), 'kind');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Category'), 'scope');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Category'), 'store');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Category'), 'allow');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Category" ("id", "name", "kind") VALUES (lastval(), 'Config', 'entity');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Config'), 'name');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Config'), 'data');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Category" ("id", "name", "kind") VALUES (lastval(), 'Session', 'details');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Session'), 'account');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Session'), 'token');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Session'), 'ip');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Session'), 'data');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Category" ("id", "name", "kind") VALUES (lastval(), 'Cursor', 'details');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Cursor'), 'session');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Cursor'), 'hashsum');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Cursor'), 'created');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Cursor'), 'query');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Cursor'), 'version');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Category" ("id", "name", "kind") VALUES (lastval(), 'Field', 'registry');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Field'), 'category');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Field'), 'name');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Category" ("id", "name", "kind") VALUES (lastval(), 'File', 'registry');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'File'), 'filename');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'File'), 'crc32');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'File'), 'hashsum');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'File'), 'size');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'File'), 'mediaType');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'File'), 'accessLast');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'File'), 'accessCount');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'File'), 'compressionFormat');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'File'), 'compressionSize');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Category" ("id", "name", "kind") VALUES (lastval(), 'Server', 'registry');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Server'), 'name');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Server'), 'suffix');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Server'), 'ip');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Server'), 'kind');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Server'), 'ports');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Category" ("id", "name", "kind") VALUES (lastval(), 'Journal', 'journal');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Journal'), 'identifier');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Journal'), 'account');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Journal'), 'server');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Journal'), 'action');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Journal'), 'dateTime');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Journal'), 'ip');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Journal'), 'details');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Category" ("id", "name", "kind") VALUES (lastval(), 'Locking', 'details');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Locking'), 'identifier');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Locking'), 'session');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Locking'), 'request');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Locking'), 'start');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Locking'), 'expire');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Locking'), 'updates');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Category" ("id", "name", "kind") VALUES (lastval(), 'Permission', 'relation');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Permission'), 'role');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Permission'), 'identifier');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "categoryId", "name") VALUES (lastval(), (SELECT "id" FROM "Category" WHERE "name" = 'Permission'), 'action');

UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Category') WHERE "id" = (SELECT "id" FROM "Category" WHERE "name" = 'Identifier');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Identifier') AND "name" = 'category');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Identifier') AND "name" = 'storage');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Identifier') AND "name" = 'status');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Identifier') AND "name" = 'creation');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Identifier') AND "name" = 'change');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Identifier') AND "name" = 'lock');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Identifier') AND "name" = 'version');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Identifier') AND "name" = 'hashsum');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Category') WHERE "id" = (SELECT "id" FROM "Category" WHERE "name" = 'Unit');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Unit') AND "name" = 'name');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Unit') AND "name" = 'parent');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Category') WHERE "id" = (SELECT "id" FROM "Category" WHERE "name" = 'Role');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Role') AND "name" = 'name');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Role') AND "name" = 'active');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Role') AND "name" = 'unit');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Category') WHERE "id" = (SELECT "id" FROM "Category" WHERE "name" = 'Account');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Account') AND "name" = 'login');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Account') AND "name" = 'password');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Account') AND "name" = 'active');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Account') AND "name" = 'email');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Account') AND "name" = 'phone');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Account') AND "name" = 'fullNameGiven');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Account') AND "name" = 'fullNameMiddle');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Account') AND "name" = 'fullNameSurname');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Category') WHERE "id" = (SELECT "id" FROM "Category" WHERE "name" = 'Catalog');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Catalog') AND "name" = 'parent');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Catalog') AND "name" = 'name');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Category') WHERE "id" = (SELECT "id" FROM "Category" WHERE "name" = 'Category');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Category') AND "name" = 'name');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Category') AND "name" = 'kind');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Category') AND "name" = 'scope');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Category') AND "name" = 'store');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Category') AND "name" = 'allow');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Category') WHERE "id" = (SELECT "id" FROM "Category" WHERE "name" = 'Config');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Config') AND "name" = 'name');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Config') AND "name" = 'data');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Category') WHERE "id" = (SELECT "id" FROM "Category" WHERE "name" = 'Session');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Session') AND "name" = 'account');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Session') AND "name" = 'token');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Session') AND "name" = 'ip');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Session') AND "name" = 'data');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Category') WHERE "id" = (SELECT "id" FROM "Category" WHERE "name" = 'Cursor');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Cursor') AND "name" = 'session');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Cursor') AND "name" = 'hashsum');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Cursor') AND "name" = 'created');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Cursor') AND "name" = 'query');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Cursor') AND "name" = 'version');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Category') WHERE "id" = (SELECT "id" FROM "Category" WHERE "name" = 'Field');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') AND "name" = 'category');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') AND "name" = 'name');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Category') WHERE "id" = (SELECT "id" FROM "Category" WHERE "name" = 'File');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'File') AND "name" = 'filename');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'File') AND "name" = 'crc32');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'File') AND "name" = 'hashsum');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'File') AND "name" = 'size');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'File') AND "name" = 'mediaType');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'File') AND "name" = 'accessLast');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'File') AND "name" = 'accessCount');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'File') AND "name" = 'compressionFormat');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'File') AND "name" = 'compressionSize');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Category') WHERE "id" = (SELECT "id" FROM "Category" WHERE "name" = 'Server');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Server') AND "name" = 'name');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Server') AND "name" = 'suffix');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Server') AND "name" = 'ip');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Server') AND "name" = 'kind');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Server') AND "name" = 'ports');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Category') WHERE "id" = (SELECT "id" FROM "Category" WHERE "name" = 'Journal');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Journal') AND "name" = 'identifier');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Journal') AND "name" = 'account');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Journal') AND "name" = 'server');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Journal') AND "name" = 'action');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Journal') AND "name" = 'dateTime');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Journal') AND "name" = 'ip');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Journal') AND "name" = 'details');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Category') WHERE "id" = (SELECT "id" FROM "Category" WHERE "name" = 'Locking');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Locking') AND "name" = 'identifier');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Locking') AND "name" = 'session');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Locking') AND "name" = 'request');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Locking') AND "name" = 'start');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Locking') AND "name" = 'expire');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Locking') AND "name" = 'updates');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Category') WHERE "id" = (SELECT "id" FROM "Category" WHERE "name" = 'Permission');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Permission') AND "name" = 'role');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Permission') AND "name" = 'identifier');
UPDATE "Identifier" SET "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "categoryId" = (SELECT "id" FROM "Category" WHERE "name" = 'Permission') AND "name" = 'action');
