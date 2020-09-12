CREATE EXTENSION hstore;
CREATE EXTENSION pg_trgm;

CREATE TABLE "Country" (
  "countryId" bigint generated always as identity,
  "name" varchar NOT NULL
);

ALTER TABLE "Country" ADD CONSTRAINT "pkCountry" PRIMARY KEY ("countryId");
CREATE UNIQUE INDEX "akCountryName" ON "Country" ("name");

CREATE TABLE "City" (
  "cityId" bigint generated always as identity,
  "countryId" bigint NOT NULL,
  "name" varchar NOT NULL
);

ALTER TABLE "City" ADD CONSTRAINT "pkCity" PRIMARY KEY ("cityId");
ALTER TABLE "City" ADD CONSTRAINT "fkCityCountry" FOREIGN KEY ("countryId") REFERENCES "Country" ("countryId") ON DELETE CASCADE;
CREATE UNIQUE INDEX "akCityName" ON "City" ("name");
