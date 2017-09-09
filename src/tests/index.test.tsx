import date from 'apollo-module-date';
import { mount, shallow } from 'enzyme';
import { action, observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import * as sinon from 'Sinon';

import { compose, connectProps, graphql, shallowCompare } from '../index';
import {
  configure,
  initialiseApolloDecorator,
  initialiseApolloMocks,
  mountContainer,
  waitForQueries
} from '../testing/index';

class State {
  @observable public detail = 'Detail';
}

const state = new State();

describe('container', function() {
  const typeDefs = `
  type Query {
    helloWorld: String
  }

  type Mutation {
    changeDetail(what: String): String
  }

  schema {
    query: Query
    mutation: Mutation
  }
`;

  let greeting = () => 'Hello from Apollo!!';
  let mutation: (what: string) => string;

  const queries = {
    helloWorld: () => {
      return greeting();
    }
  };

  const mutations = {
    changeDetail: (query: any, variables: any) => {
      return mutation(variables.what);
    }
  };

  const HelloWorld = observer(({ data }: any) => {
    const hello = data && data.helloWorld;
    if (data && data.loading) {
      return <h1 id="loading">Loading one second please!</h1>;
    }
    return (
      <div>
        <h1 id="content">{hello}</h1>
        <div id="detail">{state.detail}</div>
      </div>
    );
  });

  const query = gql`
    query hello {
      helloWorld
    }
  `;

  const mutationText = gql`
    mutation changeDetail($what: String) {
      changeDetail(what: $what)
    }
  `;

  const Composed = graphql(query)(HelloWorld);

  const context = {};
  const { ApolloDecorator, graphqlClient } = initialiseApolloDecorator({
    context,
    mutations,
    queries,
    typeDefs
  });

  beforeEach(function() {
    greeting = () => 'Hello from Apollo!!';
    mutation = (what: string) => {
      state.detail = what;
      return 'Returned';
    };
  });

  it('can call query with callbacks', async function() {
    const thenCallback = sinon.stub();
    const finalCallback = sinon.stub();
    const catchCallback = sinon.stub();

    const greetings = await graphqlClient.query({
      finalCallback,
      query,
      thenCallback
    });

    greetings.data.should.deep.equal({ helloWorld: 'Hello from Apollo!!' });
    thenCallback.should.have.been.calledWith({ helloWorld: 'Hello from Apollo!!' }, context);
    finalCallback.should.have.been.calledWith(context);
    catchCallback.should.not.have.been.called;

    // check errors
    graphqlClient.resetStore();
    greeting = () => {
      throw new Error('Failed');
    };

    await graphqlClient
      .query({
        catchCallback,
        finalCallback,
        query,
        thenCallback
      })
      .should.be.rejectedWith('GraphQL error: Failed');

    catchCallback.should.have.been.called;
  });

  it('can call mutation with callbacks', async function() {
    const thenCallback = sinon.stub();
    const finalCallback = sinon.stub();
    const catchCallback = sinon.stub();

    const greetings = await graphqlClient.mutate({
      mutation: mutationText,
      variables: {
        what: 'Resolved'
      },
      thenCallback,
      finalCallback,
      catchCallback
    });

    greetings.data.should.deep.equal({ changeDetail: 'Returned' });
    thenCallback.should.have.been.calledWith({ changeDetail: 'Returned' }, context);
    finalCallback.should.have.been.calledWith(context);
    catchCallback.should.not.have.been.called;

    // check errors
    graphqlClient.resetStore();
    mutation = () => {
      throw new Error('Failed');
    };

    await graphqlClient
      .mutate({
        mutation: mutationText,
        variables: {
          what: 'Resolved'
        },
        thenCallback,
        finalCallback,
        catchCallback
      })
      .should.be.rejectedWith('GraphQL error: Failed');

    catchCallback.should.have.been.called;
    graphqlClient.mobxQueryStore.activeQueries.length.should.equal(0);
  });

  it('can mount container', async function() {
    const component = (
      <ApolloDecorator>
        <Composed />
      </ApolloDecorator>
    );
    const wrapper = await mountContainer(component);
    wrapper
      .find('#content')
      .text()
      .should.equal('Hello from Apollo!!');
  });

});
