({
  country: 'Country',
  name: { type: 'string', unique: true },
  location: { type: 'point', required: false },
  population: { type: 'number', default: 0 },
});
