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

interface Unit {
  unitId: number;
  name: string;
  parentId?: number;
}

interface Role {
  roleId: number;
  name: string;
  active: boolean;
}

interface Account {
  accountId: number;
  login: string;
  password?: string;
  active: boolean;
  unitId: number;
}

interface Catalog {
  catalogId: number;
  name: string;
  parentId?: number;
}

interface Category {
  categoryId: number;
  name: string;
  kind: string;
  scope: string;
  store: string;
  allow: string;
}

interface Field {
  fieldId: number;
  name: string;
  categoryId: number;
}

interface Server {
  serverId: number;
  name: string;
  suffix: string;
  ip: string;
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
  ip: string;
  details: string;
}

interface Permission {
  permissionId: number;
  roleId: number;
  identifierId: number;
  action: string;
}

interface Session {
  sessionId: number;
  accountId: number;
  token: string;
  ip: string;
  data: string;
}
