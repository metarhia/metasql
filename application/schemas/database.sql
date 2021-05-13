CREATE TABLE "Application" (
  "applicationId" bigint generated always as identity,
  "name" varchar NOT NULL
);

ALTER TABLE "Application" ADD CONSTRAINT "pkApplication" PRIMARY KEY ("application");

CREATE TABLE "Unit" (
  "unitId" bigint generated always as identity,
  "name" varchar NOT NULL,
  "applicationId" bigint NOT NULL
);

ALTER TABLE "Unit" ADD CONSTRAINT "pkUnit" PRIMARY KEY ("unit");
ALTER TABLE "Unit" ADD CONSTRAINT "fkUnitApplication" FOREIGN KEY ("applicationId") REFERENCES "Application" ("applicationId");

CREATE TABLE "Account" (
  "accountId" bigint generated always as identity,
  "login" varchar NOT NULL,
  "password" varchar NOT NULL,
  "blocked" boolean NOT NULL DEFAULT false,
  "unitId" bigint NOT NULL,
  "fullNameGiven" varchar,
  "fullNameMiddle" varchar,
  "fullNameSurname" varchar,
  "birthDate" varchar,
  "birthPlace" varchar,
  "addressCountryId" bigint,
  "addressProvinceId" bigint,
  "addressCityId" bigint,
  "addressAddress1" varchar,
  "addressAddress2" varchar,
  "addressZipCode" varchar
);

ALTER TABLE "Account" ADD CONSTRAINT "pkAccount" PRIMARY KEY ("account");
ALTER TABLE "Account" ADD CONSTRAINT "fkAccountUnit" FOREIGN KEY ("unitId") REFERENCES "Unit" ("unitId");
ALTER TABLE "Account" ADD CONSTRAINT "fkAccountAddressCountry" FOREIGN KEY ("addressCountryId") REFERENCES "Country" ("countryId");
ALTER TABLE "Account" ADD CONSTRAINT "fkAccountAddressProvince" FOREIGN KEY ("addressProvinceId") REFERENCES "Province" ("provinceId");
ALTER TABLE "Account" ADD CONSTRAINT "fkAccountAddressCity" FOREIGN KEY ("addressCityId") REFERENCES "City" ("cityId");

CREATE TABLE "AccountRole" (
  "accountId" bigint NOT NULL,
  "roleId" bigint NOT NULL
);

ALTER TABLE "AccountRole" ADD CONSTRAINT "pkAccountRole" PRIMARY KEY ("accountId", "roleId");
ALTER TABLE "AccountRole" ADD CONSTRAINT "fkAccountRoleAccount" FOREIGN KEY ("accountId") REFERENCES "Account" ("accountId");
ALTER TABLE "AccountRole" ADD CONSTRAINT "fkAccountRoleRole" FOREIGN KEY ("roleId") REFERENCES "Role" ("roleId");

CREATE TABLE "Catalog" (
  "catalogId" bigint generated always as identity,
  "name" varchar NOT NULL,
  "parentId" bigint,
  "applicationId" bigint NOT NULL
);

ALTER TABLE "Catalog" ADD CONSTRAINT "pkCatalog" PRIMARY KEY ("catalog");
ALTER TABLE "Catalog" ADD CONSTRAINT "fkCatalogParent" FOREIGN KEY ("parentId") REFERENCES "Catalog" ("catalogId");
ALTER TABLE "Catalog" ADD CONSTRAINT "fkCatalogApplication" FOREIGN KEY ("applicationId") REFERENCES "Application" ("applicationId");

CREATE TABLE "CatalogIdentifier" (
  "catalogId" bigint NOT NULL,
  "identifierId" bigint NOT NULL
);

ALTER TABLE "CatalogIdentifier" ADD CONSTRAINT "pkCatalogIdentifier" PRIMARY KEY ("catalogId", "identifierId");
ALTER TABLE "CatalogIdentifier" ADD CONSTRAINT "fkCatalogIdentifierCatalog" FOREIGN KEY ("catalogId") REFERENCES "Catalog" ("catalogId");
ALTER TABLE "CatalogIdentifier" ADD CONSTRAINT "fkCatalogIdentifierIdentifier" FOREIGN KEY ("identifierId") REFERENCES "Identifier" ("identifierId");

CREATE TABLE "Category" (
  "categoryId" bigint generated always as identity,
  "name" varchar NOT NULL,
  "kind" string NOT NULL,
  "scope" string NOT NULL DEFAULT application,
  "store" string NOT NULL DEFAULT persistent,
  "allow" string NOT NULL DEFAULT write,
  "applicationId" bigint NOT NULL
);

ALTER TABLE "Category" ADD CONSTRAINT "pkCategory" PRIMARY KEY ("category");
ALTER TABLE "Category" ADD CONSTRAINT "fkCategoryApplication" FOREIGN KEY ("applicationId") REFERENCES "Application" ("applicationId");

CREATE TABLE "Identifier" (
  "identifierId" bigint generated always as identity,
  "categoryId" bigint NOT NULL,
  "storage" string NOT NULL,
  "status" string NOT NULL,
  "creation" timestamp with time zone NOT NULL,
  "change" timestamp with time zone NOT NULL,
  "lock" boolean NOT NULL DEFAULT false,
  "version" integer NOT NULL DEFAULT 0,
  "hashsum" varchar NOT NULL
);

ALTER TABLE "Identifier" ADD CONSTRAINT "pkIdentifier" PRIMARY KEY ("identifier");
ALTER TABLE "Identifier" ADD CONSTRAINT "fkIdentifierCategory" FOREIGN KEY ("categoryId") REFERENCES "Category" ("categoryId");

CREATE TABLE "Server" (
  "serverId" bigint generated always as identity,
  "name" varchar NOT NULL,
  "suffix" varchar NOT NULL,
  "kind" string NOT NULL DEFAULT server,
  "ports" jsonb NOT NULL
);

ALTER TABLE "Server" ADD CONSTRAINT "pkServer" PRIMARY KEY ("server");

CREATE TABLE "Journal" (
  "journalId" bigint generated always as identity,
  "identifierId" bigint NOT NULL,
  "accountId" bigint NOT NULL,
  "serverId" bigint NOT NULL,
  "action" varchar NOT NULL,
  "dateTime" timestamp with time zone NOT NULL,
  "details" jsonb NOT NULL
);

ALTER TABLE "Journal" ADD CONSTRAINT "pkJournal" PRIMARY KEY ("journal");
ALTER TABLE "Journal" ADD CONSTRAINT "fkJournalIdentifier" FOREIGN KEY ("identifierId") REFERENCES "Identifier" ("identifierId");
ALTER TABLE "Journal" ADD CONSTRAINT "fkJournalAccount" FOREIGN KEY ("accountId") REFERENCES "Account" ("accountId");
ALTER TABLE "Journal" ADD CONSTRAINT "fkJournalServer" FOREIGN KEY ("serverId") REFERENCES "Server" ("serverId");

CREATE TABLE "Role" (
  "roleId" bigint generated always as identity,
  "name" varchar NOT NULL,
  "blocked" boolean NOT NULL DEFAULT false
);

ALTER TABLE "Role" ADD CONSTRAINT "pkRole" PRIMARY KEY ("role");

CREATE TABLE "Permission" (
  "permissionId" bigint generated always as identity,
  "roleId" bigint NOT NULL,
  "identifierId" bigint NOT NULL,
  "action" varchar NOT NULL,
  "kind" string NOT NULL
);

ALTER TABLE "Permission" ADD CONSTRAINT "pkPermission" PRIMARY KEY ("permission");
ALTER TABLE "Permission" ADD CONSTRAINT "fkPermissionRole" FOREIGN KEY ("roleId") REFERENCES "Role" ("roleId");
ALTER TABLE "Permission" ADD CONSTRAINT "fkPermissionIdentifier" FOREIGN KEY ("identifierId") REFERENCES "Identifier" ("identifierId");

CREATE TABLE "Session" (
  "sessionId" bigint generated always as identity,
  "accountId" bigint NOT NULL,
  "token" varchar NOT NULL,
  "data" jsonb NOT NULL
);

ALTER TABLE "Session" ADD CONSTRAINT "pkSession" PRIMARY KEY ("session");
ALTER TABLE "Session" ADD CONSTRAINT "fkSessionAccount" FOREIGN KEY ("accountId") REFERENCES "Account" ("accountId");
