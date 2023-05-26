CREATE TABLE "Identifier" (
  "id" bigint generated always as identity,
  "entityId" bigint NULL,
  "storage" varchar NOT NULL DEFAULT 'master',
  "status" varchar NOT NULL DEFAULT 'actual',
  "creation" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "change" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "locked" boolean NOT NULL DEFAULT false,
  "version" integer NOT NULL DEFAULT 0,
  "hashsum" varchar NOT NULL DEFAULT ''
);

ALTER TABLE "Identifier" ADD CONSTRAINT "pkIdentifier" PRIMARY KEY ("id");
ALTER TABLE "Identifier" ADD CONSTRAINT "fkIdentifierEntity" FOREIGN KEY ("entityId") REFERENCES "Identifier" ("id");
CREATE INDEX "idxIdentifierStorage" ON "Identifier" ("storage");
CREATE INDEX "idxIdentifierStatus" ON "Identifier" ("status");

CREATE TABLE "Division" (
  "id" bigint NOT NULL,
  "name" varchar NOT NULL,
  "parentId" bigint NULL
);

ALTER TABLE "Division" ADD CONSTRAINT "pkDivision" PRIMARY KEY ("id");
ALTER TABLE "Division" ADD CONSTRAINT "fkDivisionId" FOREIGN KEY ("id") REFERENCES "Identifier" ("id");
CREATE UNIQUE INDEX "akDivisionName" ON "Division" ("name");
ALTER TABLE "Division" ADD CONSTRAINT "fkDivisionParent" FOREIGN KEY ("parentId") REFERENCES "Division" ("id");

CREATE TABLE "Role" (
  "roleId" bigint generated always as identity,
  "name" varchar NOT NULL,
  "active" boolean NOT NULL DEFAULT true,
  "divisionId" bigint NOT NULL
);

ALTER TABLE "Role" ADD CONSTRAINT "pkRole" PRIMARY KEY ("roleId");
CREATE UNIQUE INDEX "akRoleName" ON "Role" ("name");
ALTER TABLE "Role" ADD CONSTRAINT "fkRoleDivision" FOREIGN KEY ("divisionId") REFERENCES "Division" ("id") ON DELETE RESTRICT;

CREATE TABLE "Account" (
  "id" bigint NOT NULL,
  "login" varchar(64) NOT NULL,
  "password" varchar NOT NULL,
  "active" boolean NOT NULL DEFAULT true,
  "fullName" varchar NULL,
  "email" varchar(255) NULL,
  "phone" varchar(15) NULL
);

ALTER TABLE "Account" ADD CONSTRAINT "pkAccount" PRIMARY KEY ("id");
ALTER TABLE "Account" ADD CONSTRAINT "fkAccountId" FOREIGN KEY ("id") REFERENCES "Identifier" ("id");
CREATE UNIQUE INDEX "akAccountLogin" ON "Account" ("login");
CREATE INDEX "idxAccountEmail" ON "Account" ("email");
CREATE INDEX "idxAccountPhone" ON "Account" ("phone");

CREATE TABLE "AccountDivision" (
  "accountId" bigint NOT NULL,
  "divisionId" bigint NOT NULL
);

ALTER TABLE "AccountDivision" ADD CONSTRAINT "pkAccountDivision" PRIMARY KEY ("accountId", "divisionId");
ALTER TABLE "AccountDivision" ADD CONSTRAINT "fkAccountDivisionAccount" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE;
ALTER TABLE "AccountDivision" ADD CONSTRAINT "fkAccountDivisionDivision" FOREIGN KEY ("divisionId") REFERENCES "Division" ("id") ON DELETE CASCADE;

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

CREATE TABLE "Entity" (
  "id" bigint NOT NULL,
  "name" varchar NOT NULL,
  "kind" varchar NOT NULL DEFAULT 'entity',
  "scope" varchar NOT NULL DEFAULT 'system',
  "store" varchar NOT NULL DEFAULT 'persistent',
  "allow" varchar NOT NULL DEFAULT 'write'
);

ALTER TABLE "Entity" ADD CONSTRAINT "pkEntity" PRIMARY KEY ("id");
ALTER TABLE "Entity" ADD CONSTRAINT "fkEntityId" FOREIGN KEY ("id") REFERENCES "Identifier" ("id");
CREATE UNIQUE INDEX "akEntityName" ON "Entity" ("name");

CREATE TABLE "Field" (
  "id" bigint NOT NULL,
  "entityId" bigint NOT NULL,
  "name" varchar NOT NULL
);

ALTER TABLE "Field" ADD CONSTRAINT "pkField" PRIMARY KEY ("id");
ALTER TABLE "Field" ADD CONSTRAINT "fkFieldId" FOREIGN KEY ("id") REFERENCES "Identifier" ("id");
ALTER TABLE "Field" ADD CONSTRAINT "fkFieldEntity" FOREIGN KEY ("entityId") REFERENCES "Entity" ("id") ON DELETE CASCADE;
CREATE UNIQUE INDEX "akFieldNaturalKey" ON "Field" ("entityId", "name");

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
INSERT INTO "Entity" ("id", "name", "kind") VALUES (lastval(), 'Identifier', 'entity');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Identifier'), 'entity');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Identifier'), 'storage');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Identifier'), 'status');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Identifier'), 'creation');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Identifier'), 'change');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Identifier'), 'locked');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Identifier'), 'version');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Identifier'), 'hashsum');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Entity" ("id", "name", "kind") VALUES (lastval(), 'Division', 'registry');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Division'), 'name');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Division'), 'parent');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Entity" ("id", "name", "kind") VALUES (lastval(), 'Role', 'entity');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Role'), 'name');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Role'), 'active');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Role'), 'division');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Entity" ("id", "name", "kind") VALUES (lastval(), 'Account', 'registry');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Account'), 'login');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Account'), 'password');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Account'), 'active');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Account'), 'fullName');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Account'), 'email');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Account'), 'phone');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Entity" ("id", "name", "kind") VALUES (lastval(), 'Catalog', 'registry');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Catalog'), 'parent');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Catalog'), 'name');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Entity" ("id", "name", "kind") VALUES (lastval(), 'Config', 'entity');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Config'), 'name');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Config'), 'data');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Entity" ("id", "name", "kind") VALUES (lastval(), 'Session', 'details');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Session'), 'account');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Session'), 'token');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Session'), 'ip');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Session'), 'data');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Entity" ("id", "name", "kind") VALUES (lastval(), 'Cursor', 'details');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Cursor'), 'session');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Cursor'), 'hashsum');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Cursor'), 'created');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Cursor'), 'query');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Cursor'), 'version');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Entity" ("id", "name", "kind") VALUES (lastval(), 'Entity', 'registry');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Entity'), 'name');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Entity'), 'kind');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Entity'), 'scope');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Entity'), 'store');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Entity'), 'allow');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Entity" ("id", "name", "kind") VALUES (lastval(), 'Field', 'registry');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Field'), 'entity');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Field'), 'name');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Entity" ("id", "name", "kind") VALUES (lastval(), 'File', 'registry');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'File'), 'filename');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'File'), 'crc32');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'File'), 'hashsum');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'File'), 'size');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'File'), 'mediaType');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'File'), 'accessLast');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'File'), 'accessCount');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'File'), 'compressionFormat');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'File'), 'compressionSize');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Entity" ("id", "name", "kind") VALUES (lastval(), 'Server', 'registry');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Server'), 'name');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Server'), 'suffix');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Server'), 'ip');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Server'), 'kind');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Server'), 'ports');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Entity" ("id", "name", "kind") VALUES (lastval(), 'Journal', 'journal');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Journal'), 'identifier');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Journal'), 'account');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Journal'), 'server');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Journal'), 'action');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Journal'), 'dateTime');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Journal'), 'ip');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Journal'), 'details');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Entity" ("id", "name", "kind") VALUES (lastval(), 'Locking', 'details');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Locking'), 'identifier');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Locking'), 'session');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Locking'), 'request');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Locking'), 'start');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Locking'), 'expire');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Locking'), 'updates');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Entity" ("id", "name", "kind") VALUES (lastval(), 'Permission', 'relation');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Permission'), 'role');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Permission'), 'identifier');
INSERT INTO "Identifier" DEFAULT VALUES;
INSERT INTO "Field" ("id", "entityId", "name") VALUES (lastval(), (SELECT "id" FROM "Entity" WHERE "name" = 'Permission'), 'action');

UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Entity') WHERE "id" = (SELECT "id" FROM "Entity" WHERE "name" = 'Identifier');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Identifier') AND "name" = 'entity');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Identifier') AND "name" = 'storage');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Identifier') AND "name" = 'status');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Identifier') AND "name" = 'creation');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Identifier') AND "name" = 'change');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Identifier') AND "name" = 'locked');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Identifier') AND "name" = 'version');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Identifier') AND "name" = 'hashsum');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Entity') WHERE "id" = (SELECT "id" FROM "Entity" WHERE "name" = 'Division');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Division') AND "name" = 'name');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Division') AND "name" = 'parent');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Entity') WHERE "id" = (SELECT "id" FROM "Entity" WHERE "name" = 'Role');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Role') AND "name" = 'name');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Role') AND "name" = 'active');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Role') AND "name" = 'division');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Entity') WHERE "id" = (SELECT "id" FROM "Entity" WHERE "name" = 'Account');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Account') AND "name" = 'login');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Account') AND "name" = 'password');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Account') AND "name" = 'active');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Account') AND "name" = 'fullName');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Account') AND "name" = 'email');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Account') AND "name" = 'phone');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Entity') WHERE "id" = (SELECT "id" FROM "Entity" WHERE "name" = 'Catalog');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Catalog') AND "name" = 'parent');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Catalog') AND "name" = 'name');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Entity') WHERE "id" = (SELECT "id" FROM "Entity" WHERE "name" = 'Config');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Config') AND "name" = 'name');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Config') AND "name" = 'data');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Entity') WHERE "id" = (SELECT "id" FROM "Entity" WHERE "name" = 'Session');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Session') AND "name" = 'account');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Session') AND "name" = 'token');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Session') AND "name" = 'ip');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Session') AND "name" = 'data');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Entity') WHERE "id" = (SELECT "id" FROM "Entity" WHERE "name" = 'Cursor');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Cursor') AND "name" = 'session');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Cursor') AND "name" = 'hashsum');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Cursor') AND "name" = 'created');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Cursor') AND "name" = 'query');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Cursor') AND "name" = 'version');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Entity') WHERE "id" = (SELECT "id" FROM "Entity" WHERE "name" = 'Entity');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Entity') AND "name" = 'name');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Entity') AND "name" = 'kind');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Entity') AND "name" = 'scope');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Entity') AND "name" = 'store');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Entity') AND "name" = 'allow');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Entity') WHERE "id" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') AND "name" = 'entity');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') AND "name" = 'name');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Entity') WHERE "id" = (SELECT "id" FROM "Entity" WHERE "name" = 'File');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'File') AND "name" = 'filename');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'File') AND "name" = 'crc32');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'File') AND "name" = 'hashsum');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'File') AND "name" = 'size');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'File') AND "name" = 'mediaType');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'File') AND "name" = 'accessLast');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'File') AND "name" = 'accessCount');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'File') AND "name" = 'compressionFormat');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'File') AND "name" = 'compressionSize');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Entity') WHERE "id" = (SELECT "id" FROM "Entity" WHERE "name" = 'Server');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Server') AND "name" = 'name');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Server') AND "name" = 'suffix');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Server') AND "name" = 'ip');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Server') AND "name" = 'kind');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Server') AND "name" = 'ports');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Entity') WHERE "id" = (SELECT "id" FROM "Entity" WHERE "name" = 'Journal');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Journal') AND "name" = 'identifier');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Journal') AND "name" = 'account');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Journal') AND "name" = 'server');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Journal') AND "name" = 'action');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Journal') AND "name" = 'dateTime');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Journal') AND "name" = 'ip');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Journal') AND "name" = 'details');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Entity') WHERE "id" = (SELECT "id" FROM "Entity" WHERE "name" = 'Locking');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Locking') AND "name" = 'identifier');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Locking') AND "name" = 'session');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Locking') AND "name" = 'request');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Locking') AND "name" = 'start');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Locking') AND "name" = 'expire');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Locking') AND "name" = 'updates');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Entity') WHERE "id" = (SELECT "id" FROM "Entity" WHERE "name" = 'Permission');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Permission') AND "name" = 'role');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Permission') AND "name" = 'identifier');
UPDATE "Identifier" SET "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Field') WHERE "id" = (SELECT "id" FROM "Field" WHERE "entityId" = (SELECT "id" FROM "Entity" WHERE "name" = 'Permission') AND "name" = 'action');
