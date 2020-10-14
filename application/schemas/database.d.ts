interface Planet {
  planetId: number;
  name: string;
}

interface Country {
  countryId: number;
  planetId: number;
  name: string;
}

interface City {
  cityId: number;
  countryId: number;
  name: string;
  location?: string;
  population: number;
}

interface Address {
  addressId: number;
  cityId: number;
  street: string;
  building: string;
  apartment: string;
}

interface SystemUser {
  systemUserId: number;
  login: string;
  password: string;
  fullName: string;
}

interface Changes {
  changesId: number;
  creatorId: number;
  authorId: number;
  createTime: string;
  updateTime: string;
}

interface Company {
  companyId: number;
  name: string;
}

interface CompanyCity {
  companyCityId: number;
  companyId: number;
  cityId: number;
}

interface District {
  districtId: number;
  cityId: number;
  name: string;
}

interface SystemGroup {
  systemGroupId: number;
  name: string;
}

interface SystemPassport {
  systemPassportId: number;
  number: string;
  issue: string;
}

interface SystemSession {
  systemSessionId: number;
  userId: number;
  token: string;
  ip: string;
  data: string;
}
