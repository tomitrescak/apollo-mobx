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

const typeDefs = `
type Query {
  helloWorld(greeting: String): String
}

schema {
  query: Query
}
`;

const query = gql`
  query hello($greeting: String) {
    helloWorld(greeting: $greeting)
  }
`;

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

const Parent = observer(() => {
  return (
    <div>
      {state.greeting}
      <Composed greeting={state.greeting} />
      <button id="#change" onClick={() => (state.greeting = 'Dean')} />
    </div>
  );
});

const Composed = graphql(query, {
  options: (ownProps: any) => {
    return { variables: { greeting: ownProps.greeting } };
  },
  props: ({ data, ownProps }) => ({
    data1: data,
    ownProps1: ownProps,
    custom: 'MyCustom'
  })
})(HelloWorld);

describe('Queries', function() {
  function init(say: (what: string) => string) {
    const queries = {
      helloWorld: (a: null, { greeting }: any = {}) => {
        return say(greeting);
      }
    };

    const context = {};
    const { ApolloDecorator, client } = initialiseApolloDecorator({
      context,
      queries,
      typeDefs
    });

    const component = (
      <ApolloDecorator>
        <Parent />
      </ApolloDecorator>
    );

    return {
      component,
      context,
      client
    };
  }

  it('can call query with callbacks', async function() {
    const thenCallback = sinon.stub();
    const finalCallback = sinon.stub();
    const catchCallback = sinon.stub();

    function say(what: string) {
      return 'Hello: ' + what;
    }

    const { client, context } = init(say);

    const greetings = await client.query({
      finalCallback,
      thenCallback,
      query,
      variables: {
        greeting: 'Tomas'
      }
    });

    greetings.data.should.deep.equal({ helloWorld: 'Hello: Tomas' });
    thenCallback.should.have.been.calledWith({ helloWorld: 'Hello: Tomas' }, context);
    finalCallback.should.have.been.calledWith(context);
    catchCallback.should.not.have.been.called;
  });

  it('will throw error on error', async function() {
    const thenCallback = sinon.stub();
    const finalCallback = sinon.stub();
    const catchCallback = sinon.stub();

    function say(what: string): string {
      throw new Error('Failed');
    }

    const { client, context } = init(say);

    await client
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
    function say(what: string) {
      return 'Hello: ' + what;
    }
    const { client, context, component } = init(say);
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
    let i = 0;
    function say(what: string) {
      return 'Hello: ' + what + ' ' + i++;
    }
    const { client, context, component } = init(say);
    const wrapper = mount(component);

    try {
      wrapper
        .find('#loading')
        .text()
        .should.equal('Loading one second please!');
    } catch (ex) {
      /**/
    }

    await waitForQueries(client);

    wrapper
      .find('#content')
      .text()
      .should.equal('Hello: Tomas 0');

    // now change

    wrapper.find('button').simulate('click');
    await waitForQueries(client);

    wrapper
      .find('#content')
      .text()
      .should.equal('Hello: Dean 1');

    // reset store and observe changes
    client.resetStore();
    await waitForQueries(client);
    wrapper
      .find('#content')
      .text()
      .should.equal('Hello: Dean 2');
  });
});
