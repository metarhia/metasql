CREATE TABLE "Planet" (
  "planetId" bigint generated always as identity,
  "name" varchar NOT NULL
);

ALTER TABLE "Planet" ADD CONSTRAINT "pkPlanet" PRIMARY KEY ("planet");

CREATE TABLE "Country" (
  "countryId" bigint generated always as identity,
  "planetId" bigint NOT NULL,
  "name" varchar NOT NULL
);

ALTER TABLE "Country" ADD CONSTRAINT "pkCountry" PRIMARY KEY ("country");
ALTER TABLE "Country" ADD CONSTRAINT "fkCountryPlanet" FOREIGN KEY ("planetId") REFERENCES "Planet" ("planetId") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "City" (
  "cityId" bigint generated always as identity,
  "countryId" bigint NOT NULL,
  "name" varchar NOT NULL,
  "location" geometry(Point, 4326),
  "population" integer NOT NULL DEFAULT 0
);

ALTER TABLE "City" ADD CONSTRAINT "pkCity" PRIMARY KEY ("city");
ALTER TABLE "City" ADD CONSTRAINT "fkCityCountry" FOREIGN KEY ("countryId") REFERENCES "Country" ("countryId");

CREATE TABLE "Address" (
  "cityId" bigint NOT NULL,
  "street" varchar NOT NULL,
  "building" varchar NOT NULL,
  "apartment" varchar NOT NULL
);

ALTER TABLE "Address" ADD CONSTRAINT "pkAddress" PRIMARY KEY ("cityId", "street", "building", "apartment");
ALTER TABLE "Address" ADD CONSTRAINT "fkAddressCity" FOREIGN KEY ("cityId") REFERENCES "City" ("cityId");

CREATE TABLE "SystemUser" (
  "systemUserId" bigint generated always as identity,
  "login" varchar(30) NOT NULL,
  "password" varchar NOT NULL
);

ALTER TABLE "SystemUser" ADD CONSTRAINT "pkSystemUser" PRIMARY KEY ("systemUser");

CREATE TABLE "Changes" (
  "changesId" bigint generated always as identity,
  "creatorId" bigint NOT NULL,
  "authorId" bigint NOT NULL,
  "createTime" timestamp with time zone NOT NULL,
  "updateTime" timestamp with time zone NOT NULL
);

ALTER TABLE "Changes" ADD CONSTRAINT "pkChanges" PRIMARY KEY ("changes");
ALTER TABLE "Changes" ADD CONSTRAINT "fkChangesCreator" FOREIGN KEY ("creatorId") REFERENCES "SystemUser" ("systemUserId");
ALTER TABLE "Changes" ADD CONSTRAINT "fkChangesAuthor" FOREIGN KEY ("authorId") REFERENCES "SystemUser" ("systemUserId");

CREATE TABLE "Company" (
  "companyId" bigint generated always as identity,
  "name" varchar NOT NULL
);

ALTER TABLE "Company" ADD CONSTRAINT "pkCompany" PRIMARY KEY ("company");

CREATE TABLE "CompanyAddress" (
  "companyId" bigint NOT NULL,
  "addressId" bigint NOT NULL
);

ALTER TABLE "CompanyAddress" ADD CONSTRAINT "pkCompanyAddress" PRIMARY KEY ("companyId", "addressId");
ALTER TABLE "CompanyAddress" ADD CONSTRAINT "fkCompanyAddressCompany" FOREIGN KEY ("companyId") REFERENCES "Company" ("companyId");
ALTER TABLE "CompanyAddress" ADD CONSTRAINT "fkCompanyAddressAddress" FOREIGN KEY ("addressId") REFERENCES "Address" ("addressId");

CREATE TABLE "CompanyCity" (
  "companyId" bigint NOT NULL,
  "cityId" bigint NOT NULL
);

ALTER TABLE "CompanyCity" ADD CONSTRAINT "pkCompanyCity" PRIMARY KEY ("companyId", "cityId");
ALTER TABLE "CompanyCity" ADD CONSTRAINT "fkCompanyCityCompany" FOREIGN KEY ("companyId") REFERENCES "Company" ("companyId");
ALTER TABLE "CompanyCity" ADD CONSTRAINT "fkCompanyCityCity" FOREIGN KEY ("cityId") REFERENCES "City" ("cityId");

CREATE TABLE "District" (
  "districtId" bigint generated always as identity,
  "cityId" bigint NOT NULL,
  "name" varchar NOT NULL
);

ALTER TABLE "District" ADD CONSTRAINT "pkDistrict" PRIMARY KEY ("district");
ALTER TABLE "District" ADD CONSTRAINT "fkDistrictCity" FOREIGN KEY ("cityId") REFERENCES "City" ("cityId");

CREATE TABLE "SystemGroup" (
  "systemGroupId" bigint generated always as identity,
  "name" varchar NOT NULL
);

ALTER TABLE "SystemGroup" ADD CONSTRAINT "pkSystemGroup" PRIMARY KEY ("systemGroup");

CREATE TABLE "SystemGroupSystemUser" (
  "systemGroupId" bigint NOT NULL,
  "systemUserId" bigint NOT NULL
);

ALTER TABLE "SystemGroupSystemUser" ADD CONSTRAINT "pkSystemGroupSystemUser" PRIMARY KEY ("systemGroupId", "systemUserId");
ALTER TABLE "SystemGroupSystemUser" ADD CONSTRAINT "fkSystemGroupSystemUserSystemGroup" FOREIGN KEY ("systemGroupId") REFERENCES "SystemGroup" ("systemGroupId");
ALTER TABLE "SystemGroupSystemUser" ADD CONSTRAINT "fkSystemGroupSystemUserSystemUser" FOREIGN KEY ("systemUserId") REFERENCES "SystemUser" ("systemUserId");

CREATE TABLE "SystemPassport" (
  "systemPassportId" bigint generated always as identity,
  "number" varchar NOT NULL,
  "issue" date NOT NULL
);

ALTER TABLE "SystemPassport" ADD CONSTRAINT "pkSystemPassport" PRIMARY KEY ("systemPassport");

CREATE TABLE "SystemSession" (
  "systemSessionId" bigint generated always as identity,
  "userId" bigint NOT NULL,
  "token" varchar NOT NULL,
  "ip" varchar NOT NULL,
  "data" jsonb NOT NULL
);

ALTER TABLE "SystemSession" ADD CONSTRAINT "pkSystemSession" PRIMARY KEY ("systemSession");
ALTER TABLE "SystemSession" ADD CONSTRAINT "fkSystemSessionUser" FOREIGN KEY ("userId") REFERENCES "SystemUser" ("systemUserId");
