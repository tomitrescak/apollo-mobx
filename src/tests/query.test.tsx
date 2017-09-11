import { InMemoryCache } from 'apollo-cache-inmemory/lib/inMemoryCache';
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
  @observable greeting = 'Tomas';
}

const state = new State();

describe('Queries', function() {
  const typeDefs = `
  type Query {
    helloWorld(greeting: String): String
  }

  schema {
    query: Query
  }
`;

  let say: (what: string) => string;

  const queries = {
    helloWorld: (a: null, { greeting }: any = {}) => {
      return say(greeting);
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
      </div>
    );
  });
  HelloWorld.displayName = 'HelloWorld';

  const query = gql`
    query hello($greeting: String) {
      helloWorld(greeting: $greeting)
    }
  `;

  const Composed = graphql(query, {
    options: (ownProps: any) => {
      return { variables: { greeting: ownProps.greeting } };
    },
    props: ({data, ownProps}) => ({
      data1: data,
      ownProps1: ownProps,
      custom: 'MyCustom'
    })
  })(HelloWorld);

  const context = {};
  const { ApolloDecorator, graphqlClient } = initialiseApolloDecorator({
    context,
    queries,
    typeDefs
  });

  const Parent = observer(() => {
    return (
      <div>
        {state.greeting}
        <Composed greeting={state.greeting} />
        <button id="#change" onClick={() => state.greeting = 'Dean' } />
      </div>
    );
  });

  beforeEach(function() {
    say = (what: string) => {
      return 'Hello: ' + what;
    };
  });

  it('can call query with callbacks', async function() {
    const thenCallback = sinon.stub();
    const finalCallback = sinon.stub();
    const catchCallback = sinon.stub();

    const greetings = await graphqlClient.query({
      finalCallback,
      thenCallback,
      query,
      variables: {
        greeting: 'Tomas'
      },
    });

    greetings.data.should.deep.equal({ helloWorld: 'Hello: Tomas' });
    thenCallback.should.have.been.calledWith({ helloWorld: 'Hello: Tomas' }, context);
    finalCallback.should.have.been.calledWith(context);
    catchCallback.should.not.have.been.called;

    // check errors
    graphqlClient.resetStore();
    say = () => {
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

  it('can mount container', async function() {
    const component = (
      <ApolloDecorator>
        <Parent />
      </ApolloDecorator>
    );
    const wrapper = await mountContainer(component);

    wrapper
      .find('#content')
      .text()
      .should.equal('Hello: Tomas');

    // check custom params
    const hw = wrapper.find('HelloWorld');
    hw.prop('custom').should.equal('MyCustom');
    hw.prop('data1').should.equal(hw.prop('data'));
    hw.prop('ownProps1').should.exist;

  });

  it('will wait for queries and re-render accordingly', async function() {
    const component = (
      <ApolloDecorator>
        <Parent />
      </ApolloDecorator>
    );
    const wrapper = mount(component);

    try {
      wrapper
        .find('#loading')
        .text()
        .should.equal('Loading one second please!');
    } catch (ex) {
      /**/
    }

    await waitForQueries(graphqlClient);

    wrapper
      .find('#content')
      .text()
      .should.equal('Hello: Tomas');

    // now change

    wrapper.find('button').simulate('click');
    await waitForQueries(graphqlClient);

    wrapper
    .find('#content')
    .text()
    .should.equal('Hello: Dean');

    // reset store and observe changes
    say = () => 'Reset Message';
    graphqlClient.resetStore();
    await waitForQueries(graphqlClient);
    wrapper
      .find('#content')
      .text()
      .should.equal('Reset Message');
  });
});
