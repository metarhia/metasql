({
  login: { type: 'string', unique: true, length: 30 },
  password: { type: 'string', length: { min: 10 } },
  fullName: { type: 'string', length: [5, 60] },
});
