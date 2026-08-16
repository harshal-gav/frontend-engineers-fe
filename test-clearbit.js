fetch('https://autocomplete.clearbit.com/v1/companies/suggest?query=airbnb')
  .then(res => res.json())
  .then(console.log);
