const sinon = require('sinon');
const test = require('ava');

function resetGraphqlHelper () {
  const path = require.resolve('../src/graphql');
  // eslint-disable-next-line security/detect-object-injection
  delete require.cache[path];
}

test.before(resetGraphqlHelper);

test.beforeEach((test) => {
  const { useGraphQL } = require('../src/graphql');

  test.context.mock = {
    beforeEach: sinon.stub()
  };

  test.context.useGraphQL = useGraphQL;
});

test.afterEach.always(resetGraphqlHelper);

test('When a test endpoint has not been configured an error is thrown', async (test) => {
  test.context.useGraphQL(test.context.mock);

  sinon.assert.calledOnce(test.context.mock.beforeEach);
  test.throws(
    test.context.mock.beforeEach.firstCall.args[0],
    'A test GraphQL endpoint has not been configured!'
  );
});
