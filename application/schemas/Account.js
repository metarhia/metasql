({
  Registry: {},

  login: { type: 'string', unique: true },
  password: 'string',
  blocked: { type: 'boolean', default: false },
  unit: 'Unit',
  roles: { many: 'Role' },

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
    address1: { type: 'string', required: false },
    address2: { type: 'string', required: false },
    zipCode: { type: 'string', required: false },
  },
});
