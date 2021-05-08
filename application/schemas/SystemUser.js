({
  SystemUser: 'system entity',

  login: { type: 'string', unique: true, length: 30 },
  password: { type: 'string', length: { min: 10 } },

  fullName: {
    given: '?string',
    middle: '?string',
    surname: '?string',
  },

  birth: {
    date: '?string',
    place: '?string',
  },

  address: {
    country: '?Country',
    province: '?Province',
    city: '?City',
    line: '?string',
    zip: '?string',
  },
});
