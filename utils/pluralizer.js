const compromise = require('compromise');

const pluralizeTest = (string) => {
  const doc = compromise(string);
  console.log(doc);
  console.log(doc.nouns().data())
  const hasPlural = doc.nouns().hasPlural();
  console.log(hasPlural);
  const isPlural = doc.nouns().isPlural();
  console.log(isPlural);
  console.log(isPlural.out());
}


pluralizeTest('suits');
pluralizeTest('the handmaids');
pluralizeTest('tale');
pluralizeTest('handmaids');
