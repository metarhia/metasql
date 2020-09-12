CREATE TABLE "Planet" (
  "planetId" bigint generated always as identity,
  "name" varchar NOT NULL
);

ALTER TABLE "Planet" ADD CONSTRAINT "pkPlanet" PRIMARY KEY ("planetId");

ALTER TABLE "Country" ADD COLUMN "planetId" bigint NOT NULL );

ALTER TABLE "Country" ADD CONSTRAINT "fkCountryPlanet" FOREIGN KEY ("planetId") REFERENCES "Planet" ("planetId") ON DELETE CASCADE;

CREATE TABLE "District" (
  "districtId" bigint generated always as identity,
  "cityId" bigint NOT NULL,
  "name" varchar NOT NULL
);

ALTER TABLE "District" ADD CONSTRAINT "pkDistrict" PRIMARY KEY ("districtId");
ALTER TABLE "District" ADD CONSTRAINT "fkDistrictCity" FOREIGN KEY ("cityId") REFERENCES "City" ("cityId") ON DELETE CASCADE;
