const { pick } = require('../../../src/utils/pick');

const object = {
  name: 'name',
  gender: 'gender',
  age: 5,
};

describe('pick', () => {
  test('should return an empty object if keys is an empty array', () => {
    expect(pick(object, [])).toEqual({});
  });

  test('should return a new object with only the selected properties', () => {
    expect(pick(object, ['name', 'age'])).toEqual({
      name: object.name,
      age: object.age,
    });
  });

  test('should return a new object with only the existing properties', () => {
    expect(pick(object, ['name', 'occupation'])).toEqual({ name: object.name });
  });

  test('should return an empty object if object is null or undefined', () => {
    expect(pick(null, ['name'])).toEqual({});
    expect(pick(undefined, ['name'])).toEqual({});
  });
});
