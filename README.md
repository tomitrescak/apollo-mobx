# Introduction

[![Coverage Status](https://coveralls.io/repos/github/tomitrescak/apollo-mobx/badge.svg?branch=master)](https://coveralls.io/github/tomitrescak/apollo-mobx?branch=master) [![CircleCI](https://circleci.com/gh/tomitrescak/apollo-mobx.svg?style=svg)](https://circleci.com/gh/tomitrescak/apollo-mobx)

React containers for Apollo using MobX state management.

- **100% Mobx**
- Redux Free
- Maintaining *[react-apollo](https://github.com/apollographql/react-apollo)* API 
- **EXTRA** features for Unit and Integration testing

**WARNING** Currently tested only with Apollo Client 2.0 alpha. Also, no support for SSR as of yet. PRs welcome.

Following has been shamelessly copied and adjusted from Apollo-React docs.

## Installation

It is simple to install Apollo Mobx.

```bash
npm install apollo-mobx --save
```

That’s it! You may now use Apollo Mobx in any of your React environments.

For an amazing developer experience you may also install the [Apollo Client Developer tools for Chrome][] which will give you inspectability into your Apollo Mobx data.

[Apollo Client Developer tools for Chrome]: https://chrome.google.com/webstore/detail/apollo-client-developer-t/jdkknkkbebbapilgoeccciglkfbmbnfm

## Usage

To get started you will first want to create an instance of [`ApolloClient`][] and then you will want to provide that client to your React component tree using the standard MobX [`<Provider/>`][] component. Finally, we will show you a basic example of connecting your GraphQL data to your React components with the [`graphql()`][] enhancer function.

First we want an instance of [`ApolloClient`][]. We can import the class from `react-apollo` and construct it like so:

```js
import { ApolloClient } from 'apollo-mobx'; // or from apollo-client

const client = new ApolloClient();
```

This will create a new client that you can use for all of your GraphQL data fetching needs, but most of the time you will also want to create your own custom network interface from the set of available links

```js
import { ApolloClient } from 'apollo-mobx';
import { ApolloLink, BatchHttpLink, SetContextLink } from 'apollo-link';

const setContext = (context) => context.auth = 'myToken';

const link: any = ApolloLink.from([
  new SetContextLink(setContext),
  new BatchHttpLink({ uri: 'https://graphql.example.com', batchInterval: 50 }),
]);

const cache = new InMemoryCache(window.__APOLLO_STATE_);

const client = new ApolloClient({
  cache,
  link,
});
```

Replace `https://graphql.example.com` with your GraphQL API’s URL to connect to your API.

Next you will want to add a [`<Provider/>`][] component to the root of your React component tree. All you need to do is use your existing MobX Provider and add 'client' with your new client instance

```js
import { Provider } from 'react-mobx';

ReactDOM.render(
  <Provider client={client}>
    <MyRootComponent/>
  </Provider>,
  document.getElementById('root'),
);
```

Now you may create components in this React tree that are connected to your GraphQL API.

Finally, to demonstrate the power of Apollo Mobx in building interactive UIs let us connect one of your component’s to your GraphQL server using the [`graphql()`][] component enhancer:

```js
import { gql, graphql } from 'apollo-mobx';

function TodoApp({ data: { todos, refetch } }) {
  return (
    <div>
      <button onClick={() => refetch()}>
        Refresh
      </button>
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>
            {todo.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default graphql(gql`
  query TodoAppQuery {
    todos {
      id
      text
    }
  }
`)(TodoApp);
```

With that your `<TodoApp/>` component is now connected to your GraphQL API. Whenever some other component modifies the data in your cache, this component will automatically be updated with the new data.

To learn more about querying with React Apollo be sure to start reading the [documentation article on Queries][]. If you would like to see all of the features React Apollo supports be sure to check out the [complete API reference][].

There is also an excellent [**Full-stack React + GraphQL Tutorial**][] on the Apollo developer blog.

[`ApolloClient`]: http://dev.apollodata.com/core/apollo-client-api.html#apollo-client
[`<ApolloProvider/>`]: http://dev.apollodata.com/react/api.html#ApolloProvider
[`graphql()`]: http://dev.apollodata.com/react/api.html#graphql
[`createNetworkInterface`]: http://dev.apollodata.com/core/network.html
[`<Provider/>` component in `react-redux`]: https://github.com/reactjs/react-redux/blob/master/docs/api.md#provider-store
[documentation article on Queries]: http://dev.apollodata.com/react/queries.html
[complete API reference]: http://dev.apollodata.com/react/api.html
[**Full-stack React + GraphQL Tutorial**]: https://dev-blog.apollodata.com/full-stack-react-graphql-tutorial-582ac8d24e3b#.w8e9j7jmp
[Learn Apollo]: https://www.learnapollo.com/

## Extensions

There are couple nifty extension on Apollo Client in `apollo-mobx`. First, query options contain parameters: *waitForData* and *loadingComponent*. The functionality is self explanatory. The *loadingComponent* can also be set globally in constructor of ApolloClient.

```ts
import { ApolloClient } from 'apollo-mobx';
const loadingComponent = sinon.stub().returns(<div id="loading">Loading ...</div>);

// you can set it globally
const graphqlClient = new ApolloClient({
  ...
  loadingComponent
});

// or in the container
const Composed = graphql(query, {
  loadingComponent, 
  waitForData: true,
})(HelloWorld);
``` 

There is also another HOC *waitforData* that can wait for multiple queries:

```ts
import { waitForData } from 'apollo-mobx'client

// simple

const Composed = compose(
  graphQlHoc1,
  graphQlHoc2,
  graphQlHoc3,
  waitForData('data1', { loadingComponent }); // component can again be specified globally
)(HelloWorld);

// more complext

const Composed = compose(
  graphQlHoc1,
  graphQlHoc2,
  graphQlHoc3,
  waitForData(['data1', 'data2', 'data3'])
)(HelloWorld);
```

Last extension relates to the way you specify your queries and mutation and is purely a syntactic sugar around Apollo Query and mutation.

```ts
import { ApolloClient } from 'apollo-mobx';
// you can initialise your client with a context (i.e. global libraries)
const context = {
  niceUiAlert() { ... }
}

const graphqlClient = new ApolloClient({
  ...
  context
});

const greetings = await graphqlClient.query({
  finalCallback: (context) {
    // clean up resources
  },
  thenCallback (data, context) {
    // do something with data
    context.niceUiAlert('Done!');
  },
  catchCallback(error, context) {
    context.niceUiAlert('Error: ' + error.message);
  },
  query,
  variables: {
    greeting: 'Tomas'
  },
});
```

## Documentation

For a complete React Apollo API reference visit the documentation website at: [http://dev.apollodata.com/react/api.html](http://dev.apollodata.com/react/api.html)

All of the documentation for React Apollo including usage articles and helpful recipes lives on: [http://dev.apollodata.com/react/](http://dev.apollodata.com/react/)

# Testing Extensions

To facilitate testing, we have defined following methods:

- **initialiseApolloMocks** - creates a new client with pre-defined mocks (Uses the *MockLink* and *SpyLink*)
- **initialiseApolloDecorator** - creates a provider with mocked client
- **mountContainer** - mounts an apollo container and wait for full render
- **waitForQueries** - waits until all queries and mutations have finished their execution (you need to add *SpyLink* to your client if you wish to use this feature, or use *initialiseApolloMocks* to create your client)

Examples:

```ts
import date from 'apollo-module-date';
import { mount, shallow } from 'enzyme';
import { action, observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import * as sinon from 'sinon';

import { compose, connectProps, graphql, shallowCompare } from 'apollo-mobx';
import {
  configure,
  initialiseApolloDecorator,
  initialiseApolloMocks,
  mountContainer,
  waitForQueries
} from 'apollo-mobx/testing';

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

  it('will wait for mutations and re-render accordingly', async function() {
    const component = (
      <ApolloDecorator>
        <HelloWorld />
      </ApolloDecorator>
    );
    const wrapper = mount(component);

    // utter mutation
    graphqlClient.mutate({
      mutation: mutationText,
      variables: {
        what: 'New Text'
      }
    });

    await waitForQueries(graphqlClient);
    wrapper
      .find('#detail')
      .text()
      .should.equal('New Text');
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
```

