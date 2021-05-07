({
  SystemUser: 'system entity',

  login: { type: 'string', unique: true, length: 30 },
  password: { type: 'string', length: { min: 10 } },

  fullName: {
    given: { type: 'string', required: false },
    middle: { type: 'string', required: false },
    surname: { type: 'string', required: false },
  },

  birth: {
    date: { type: 'string', required: false },
    place: { type: 'string', required: false },
  },

  address: {
    country: { type: 'Country', required: false },
    province: { type: 'Province', required: false },
    city: { type: 'City', required: false },
    line: { type: 'string', required: false },
    zip: { type: 'string', required: false },
  },
});
