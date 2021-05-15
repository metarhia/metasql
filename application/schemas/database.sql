CREATE TABLE "Identifier" (
  "id" bigint generated always as identity,
  "categoryId" bigint NOT NULL,
  "storage" varchar NOT NULL,
  "status" varchar NOT NULL,
  "creation" timestamp with time zone NOT NULL,
  "change" timestamp with time zone NOT NULL,
  "lock" boolean NOT NULL DEFAULT false,
  "version" integer NOT NULL DEFAULT 0,
  "hashsum" varchar NOT NULL
);

ALTER TABLE "Identifier" ADD CONSTRAINT "pkIdentifier" PRIMARY KEY ("id");
ALTER TABLE "Identifier" ADD CONSTRAINT "fkIdentifierId" FOREIGN KEY ("id") REFERENCES "Identifier" ("id");
ALTER TABLE "Identifier" ADD CONSTRAINT "fkIdentifierCategory" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id");

CREATE TABLE "Application" (
  "id" bigint generated always as identity,
  "name" varchar NOT NULL
);

ALTER TABLE "Application" ADD CONSTRAINT "pkApplication" PRIMARY KEY ("id");
ALTER TABLE "Application" ADD CONSTRAINT "fkApplicationId" FOREIGN KEY ("id") REFERENCES "Identifier" ("id");

CREATE TABLE "Unit" (
  "id" bigint generated always as identity,
  "name" varchar NOT NULL,
  "applicationId" bigint NOT NULL
);

ALTER TABLE "Unit" ADD CONSTRAINT "pkUnit" PRIMARY KEY ("id");
ALTER TABLE "Unit" ADD CONSTRAINT "fkUnitId" FOREIGN KEY ("id") REFERENCES "Identifier" ("id");
ALTER TABLE "Unit" ADD CONSTRAINT "fkUnitApplication" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id");

CREATE TABLE "Role" (
  "roleId" bigint generated always as identity,
  "name" varchar NOT NULL,
  "blocked" boolean NOT NULL DEFAULT false
);

ALTER TABLE "Role" ADD CONSTRAINT "pkRole" PRIMARY KEY ("roleId");

CREATE TABLE "Account" (
  "id" bigint generated always as identity,
  "login" varchar NOT NULL,
  "password" varchar NOT NULL,
  "blocked" boolean NOT NULL DEFAULT false,
  "unitId" bigint NOT NULL,
  "fullNameGiven" varchar,
  "fullNameMiddle" varchar,
  "fullNameSurname" varchar,
  "birthDate" varchar,
  "birthPlace" varchar
);

ALTER TABLE "Account" ADD CONSTRAINT "pkAccount" PRIMARY KEY ("id");
ALTER TABLE "Account" ADD CONSTRAINT "fkAccountId" FOREIGN KEY ("id") REFERENCES "Identifier" ("id");
ALTER TABLE "Account" ADD CONSTRAINT "fkAccountUnit" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id");

CREATE TABLE "AccountRole" (
  "accountId" bigint NOT NULL,
  "roleId" bigint NOT NULL
);

ALTER TABLE "AccountRole" ADD CONSTRAINT "pkAccountRole" PRIMARY KEY ("accountId", "roleId");
ALTER TABLE "AccountRole" ADD CONSTRAINT "fkAccountRoleAccount" FOREIGN KEY ("accountId") REFERENCES "Account" ("id");
ALTER TABLE "AccountRole" ADD CONSTRAINT "fkAccountRoleRole" FOREIGN KEY ("roleId") REFERENCES "Role" ("roleId");

CREATE TABLE "Catalog" (
  "id" bigint generated always as identity,
  "name" varchar NOT NULL,
  "parentId" bigint,
  "applicationId" bigint NOT NULL
);

ALTER TABLE "Catalog" ADD CONSTRAINT "pkCatalog" PRIMARY KEY ("id");
ALTER TABLE "Catalog" ADD CONSTRAINT "fkCatalogId" FOREIGN KEY ("id") REFERENCES "Identifier" ("id");
ALTER TABLE "Catalog" ADD CONSTRAINT "fkCatalogParent" FOREIGN KEY ("parentId") REFERENCES "Catalog" ("id");
ALTER TABLE "Catalog" ADD CONSTRAINT "fkCatalogApplication" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id");

CREATE TABLE "CatalogIdentifier" (
  "catalogId" bigint NOT NULL,
  "identifierId" bigint NOT NULL
);

ALTER TABLE "CatalogIdentifier" ADD CONSTRAINT "pkCatalogIdentifier" PRIMARY KEY ("catalogId", "identifierId");
ALTER TABLE "CatalogIdentifier" ADD CONSTRAINT "fkCatalogIdentifierCatalog" FOREIGN KEY ("catalogId") REFERENCES "Catalog" ("id");
ALTER TABLE "CatalogIdentifier" ADD CONSTRAINT "fkCatalogIdentifierIdentifier" FOREIGN KEY ("identifierId") REFERENCES "Identifier" ("id");

CREATE TABLE "Category" (
  "id" bigint generated always as identity,
  "name" varchar NOT NULL,
  "kind" varchar NOT NULL,
  "scope" varchar NOT NULL DEFAULT 'application',
  "store" varchar NOT NULL DEFAULT 'persistent',
  "allow" varchar NOT NULL DEFAULT 'write',
  "applicationId" bigint NOT NULL
);

ALTER TABLE "Category" ADD CONSTRAINT "pkCategory" PRIMARY KEY ("id");
ALTER TABLE "Category" ADD CONSTRAINT "fkCategoryId" FOREIGN KEY ("id") REFERENCES "Identifier" ("id");
ALTER TABLE "Category" ADD CONSTRAINT "fkCategoryApplication" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id");

CREATE TABLE "Server" (
  "id" bigint generated always as identity,
  "name" varchar NOT NULL,
  "suffix" varchar NOT NULL,
  "kind" varchar NOT NULL DEFAULT 'server',
  "ports" jsonb NOT NULL
);

ALTER TABLE "Server" ADD CONSTRAINT "pkServer" PRIMARY KEY ("id");
ALTER TABLE "Server" ADD CONSTRAINT "fkServerId" FOREIGN KEY ("id") REFERENCES "Identifier" ("id");

CREATE TABLE "Journal" (
  "journalId" bigint generated always as identity,
  "identifierId" bigint NOT NULL,
  "accountId" bigint NOT NULL,
  "serverId" bigint NOT NULL,
  "action" varchar NOT NULL,
  "dateTime" timestamp with time zone NOT NULL,
  "details" jsonb NOT NULL
);

ALTER TABLE "Journal" ADD CONSTRAINT "pkJournal" PRIMARY KEY ("journalId");
ALTER TABLE "Journal" ADD CONSTRAINT "fkJournalIdentifier" FOREIGN KEY ("identifierId") REFERENCES "Identifier" ("id");
ALTER TABLE "Journal" ADD CONSTRAINT "fkJournalAccount" FOREIGN KEY ("accountId") REFERENCES "Account" ("id");
ALTER TABLE "Journal" ADD CONSTRAINT "fkJournalServer" FOREIGN KEY ("serverId") REFERENCES "Server" ("id");

CREATE TABLE "Permission" (
  "permissionId" bigint generated always as identity,
  "roleId" bigint NOT NULL,
  "identifierId" bigint NOT NULL,
  "action" varchar NOT NULL,
  "kind" varchar NOT NULL
);

ALTER TABLE "Permission" ADD CONSTRAINT "pkPermission" PRIMARY KEY ("permissionId");
ALTER TABLE "Permission" ADD CONSTRAINT "fkPermissionRole" FOREIGN KEY ("roleId") REFERENCES "Role" ("roleId");
ALTER TABLE "Permission" ADD CONSTRAINT "fkPermissionIdentifier" FOREIGN KEY ("identifierId") REFERENCES "Identifier" ("id");

CREATE TABLE "Session" (
  "sessionId" bigint generated always as identity,
  "accountId" bigint NOT NULL,
  "token" varchar NOT NULL,
  "data" jsonb NOT NULL
);

ALTER TABLE "Session" ADD CONSTRAINT "pkSession" PRIMARY KEY ("sessionId");
ALTER TABLE "Session" ADD CONSTRAINT "fkSessionAccount" FOREIGN KEY ("accountId") REFERENCES "Account" ("id");
