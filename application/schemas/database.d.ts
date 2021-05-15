interface Identifier {
  identifierId: number;
  categoryId: number;
  storage: string;
  status: string;
  creation: string;
  change: string;
  lock: boolean;
  version: number;
  hashsum: string;
}

interface Application {
  applicationId: number;
  name: string;
}

interface Unit {
  unitId: number;
  name: string;
  applicationId: number;
}

interface Role {
  roleId: number;
  name: string;
  blocked: boolean;
}

interface Account {
  accountId: number;
  login: string;
  password: string;
  blocked: boolean;
  unitId: number;
}

interface Catalog {
  catalogId: number;
  name: string;
  parentId?: number;
  applicationId: number;
}

interface Category {
  categoryId: number;
  name: string;
  kind: string;
  scope: string;
  store: string;
  allow: string;
  applicationId: number;
}

interface Server {
  serverId: number;
  name: string;
  suffix: string;
  kind: string;
  ports: string;
}

interface Journal {
  journalId: number;
  identifierId: number;
  accountId: number;
  serverId: number;
  action: string;
  dateTime: string;
  details: string;
}

interface Permission {
  permissionId: number;
  roleId: number;
  identifierId: number;
  action: string;
  kind: string;
}

interface Session {
  sessionId: number;
  accountId: number;
  token: string;
  data: string;
}
