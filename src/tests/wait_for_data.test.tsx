import { InMemoryCache } from 'apollo-cache-inmemory/lib/inMemoryCache';
import date from 'apollo-module-date';
import { mount, shallow } from 'enzyme';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import * as sinon from 'Sinon';
import { ApolloClient } from '../client/client';
import { waitForData } from '../client/wait_for_data';
import { compose, connectProps, graphql } from '../index';
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

describe('container', function() {
  const typeDefs = `
  type Query {
    helloWorld(greeting: String): String
  }

  schema {
    query: Query
  }
`;

  const queries = {
    helloWorld: () => {
      return 'Hello: Tomas';
    }
  };

  const HelloWorld = observer(({ data }: any) => {
    const hello = data && data.helloWorld;
    return (
      <div>
        <h1 id="content">{hello}</h1>
      </div>
    );
  });

  const query = gql`
    query hello($greeting: String) {
      helloWorld(greeting: $greeting)
    }
  `;

  const context = {};
  let ApolloDecorator: ({ children }: any) => JSX.Element;
  let graphqlClient: ApolloClient<any>;

  beforeEach(() => {
    const init = initialiseApolloDecorator({
      context,
      queries,
      typeDefs
    });
    ApolloDecorator = init.ApolloDecorator;
    graphqlClient = init.graphqlClient;
  });

  it('can specify loading component on query', async function() {
    const loadingComponent = sinon.stub().returns(<div id="loading">Loading ...</div>);
    const Composed = graphql(query, {
      loadingComponent,
      waitForData: true,
    })(HelloWorld);

    const component = (
      <ApolloDecorator>
        <Composed />
      </ApolloDecorator>
    );
    const wrapper = mount(component);

    loadingComponent.should.have.been.called;

    await waitForQueries(graphqlClient);

    wrapper
      .find('#content')
      .text()
      .should.equal('Hello: Tomas');
  });

  it('can specify loading component on client', async function() {
    const loadingComponent = sinon.stub().returns(<div id="loading">Loading ...</div>);
    graphqlClient.loadingComponent = loadingComponent;

    const Composed = graphql(query, {
      waitForData: true,
    })(HelloWorld);

    const component = (
      <ApolloDecorator>
        <Composed />
      </ApolloDecorator>
    );
    const wrapper = mount(component);

    await waitForQueries(graphqlClient);

    loadingComponent.should.have.been.called;

  });

  it('can compose with wait for data and wait for data to load', async function() {
    const loadingComponent = sinon.stub().returns(<div id="loading">Loading ...</div>);
    graphqlClient.loadingComponent = loadingComponent;

    const container = graphql(query);

    const Composed = compose(
      container,
      waitForData()
    )(HelloWorld);

    const component = (
      <ApolloDecorator>
        <Composed />
      </ApolloDecorator>
    );
    const wrapper = mount(component);

    await waitForQueries(graphqlClient);

    loadingComponent.should.have.been.called;
  });

  it('can compose with wait for data and wait for data to load based on selector', async function() {
    const loadingComponent = sinon.stub().returns(<div id="loading">Loading ...</div>);
    graphqlClient.loadingComponent = loadingComponent;

    const container = graphql(query);

    const Composed = compose(
      container,
      waitForData('data.helloWorld')
    )(HelloWorld);

    const component = (
      <ApolloDecorator>
        <Composed />
      </ApolloDecorator>
    );
    const wrapper = mount(component);

    await waitForQueries(graphqlClient);

    loadingComponent.should.have.been.called;
  });

  it('can compose with wait for data and wait for data to load', async function() {
    const loadingComponent = sinon.stub().returns(<div id="loading">Loading ...</div>);

    const container = graphql(query);

    const Composed = compose(
      container,
      waitForData('data', { loadingComponent })
    )(HelloWorld);

    const component = (
      <ApolloDecorator>
        <Composed />
      </ApolloDecorator>
    );
    const wrapper = mount(component);

    await waitForQueries(graphqlClient);

    loadingComponent.should.have.been.called;
  });

  it('can compose with wait for data and wait for data to load', async function() {
    const loadingComponent = sinon.stub().returns(<div id="loading">Loading ...</div>);
    graphqlClient.loadingComponent = null;

    const container = graphql(query);

    const Composed = compose(
      container,
      waitForData('error', { loadingComponent })
    )(HelloWorld);

    const component = (
      <ApolloDecorator>
        <Composed />
      </ApolloDecorator>
    );
    (() => mount(component)).should.throw('Loading container did not find key in the apollo result set: error');
  });
});
