import date from 'apollo-module-date';
import { mount, shallow } from 'enzyme';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import * as sinon from 'sinon';
import { compose, connectProps, gql, graphql } from '../index';
import {
  configure,
  initialiseApolloDecorator,
  initialiseApolloMocks,
  mountContainer,
  waitForQueries
} from '../testing/index';

class State {
  @observable detail = 'Detail';
}

const state = new State();

describe('Mutations', function() {
  const typeDefs = `
  type Mutation {
    changeDetail(what: String): String
  }

  type Query {
    hello: String
  }

  schema {
    mutation: Mutation
    query: Query
  }
`;

  const HelloWorld = observer(({ data }: any) => {
    const hello = data && data.helloWorld;
    if (data && data.loading) {
      return <h1 id="loading">Loading one second please!</h1>;
    }
    return (
      <div>
        <div id="detail">{state.detail}</div>
      </div>
    );
  });

  const mutationText = gql`
    mutation changeDetail($what: String) {
      changeDetail(what: $what)
    }
  `;

  // beforeEach(function() {
  //   mutation = (what: string) => {
  //     state.detail = what;
  //     return 'Returned';
  //   };
  // });

  function init(mutation: (what: string) => string) {
    const context = {};

    const mutations = {
      changeDetail: (query: any, variables: any) => {
        return mutation(variables.what);
      }
    };

    const { ApolloDecorator, client } = initialiseApolloDecorator({
      context,
      mutations,
      typeDefs
    });

    const component = (
      <ApolloDecorator>
        <HelloWorld />
      </ApolloDecorator>
    );

    return {
      client,
      component,
      context,
    };
  }

  it('can call mutation with callbacks', async function() {
    function mutation(what: string) {
      return what;
    }

    const thenCallback = sinon.stub();
    const finalCallback = sinon.stub();
    const catchCallback = sinon.stub();

    const { client, context } = init(mutation);

    const greetings = await client.mutate({
      mutation: mutationText,
      variables: {
        what: 'Returned'
      },
      thenCallback,
      finalCallback,
      catchCallback
    });

    greetings.data.should.deep.equal({ changeDetail: 'Returned' });
    thenCallback.should.have.been.calledWith({ changeDetail: 'Returned' }, context);
    finalCallback.should.have.been.calledWith(context);
    catchCallback.should.not.have.been.called;
  });

  xit('throws errors', async function() {
    function mutation(what: string): string {
      throw new Error('Failed');
    }

    const thenCallback = sinon.stub();
    const finalCallback = sinon.stub();
    const catchCallback = sinon.stub();

    const { client, context } = init(mutation);

    client.resetStore();

    const result = await client
      .mutate({
        mutation: mutationText,
        variables: {
          what: 'Resolved'
        },
        thenCallback,
        finalCallback,
        catchCallback
      }).should.be.rejectedWith('GraphQL error: Failed');

    catchCallback.should.have.been.called;
  });

  it('will wait for mutations and re-render accordingly', async function() {
    function mutation(what: string): string {
      state.detail = what;
      return what;
    }

    const { client, context, component } = init(mutation);

    const wrapper = mount(component);

    // utter mutation
    const result = await client.mutate({
      mutation: mutationText,
      variables: {
        what: 'New Text'
      }
    });

    await waitForQueries(client);

    wrapper
      .find('#detail')
      .text()
      .should.equal('New Text');
  });
});
