import InMemoryCache from 'apollo-cache-inmemory';
import ApolloClientBase from 'apollo-client';
import { ApolloLink } from 'apollo-link-core/lib';
import { mount, ReactWrapper } from 'enzyme';
import { GraphQLScalarType } from 'graphql';
import { addMockFunctionsToSchema, makeExecutableSchema } from 'graphql-tools';
import { Kind } from 'graphql/language';
import { autorun } from 'mobx';
import { Provider as MobxProvider } from 'mobx-react';
import * as React from 'react';
import { ApolloClient } from '../client/client';
import MockLink from './mock_link';
import { SpyLink } from './spy_link';

export interface ApolloProps<T> {
  resolvers?: any;
  typeDefs?: string;
  queries?: any;
  mutations?: any;
  reducers?: {};
  context?: T;
  loadingComponent?: (props: any) => JSX.Element;
}

let globalTypeDefs: string;
let globalResolvers: any = {};

export function configure(schema: string, resolver: any) {
  globalTypeDefs = schema;
  globalResolvers = resolver;
}

export function initialiseApolloMocks<T>({
  queries = {},
  mutations = {},
  resolvers = {},
  reducers = {},
  typeDefs = globalTypeDefs,
  context,
  loadingComponent
}: ApolloProps<T>) {
  // add crap around mocks
  const finalMocks = {
    ...resolvers,
    Mutation: () => mutations || {},
    Query: () => queries || {},
  };

  const schema = makeExecutableSchema({ typeDefs, resolvers: globalResolvers });
  addMockFunctionsToSchema({
    mocks: finalMocks,
    schema,
  });

  const apolloCache = new InMemoryCache(global.__APOLLO_STATE_);

  const graphqlClient: ApolloClient<typeof context> = new ApolloClient({
    cache: apolloCache,
    context,
    link: ApolloLink.from([
      new SpyLink(() => graphqlClient),
      new MockLink({ schema }),
    ]),
    loadingComponent
  });
  return graphqlClient;
}

export function initialiseApolloDecorator<T>({
  queries = {},
  mutations = {},
  resolvers = {},
  reducers = {},
  typeDefs,
  context,
  loadingComponent
}: ApolloProps<T>) {
  const graphqlClient = initialiseApolloMocks({ queries, mutations, resolvers, context, typeDefs, loadingComponent });

  return {
    ApolloDecorator: ({ children }: any) => {
      return (
        <MobxProvider context={context} client={graphqlClient}>
          <div>{children}</div>
        </MobxProvider>
      );
    },
    context,
    graphqlClient,
  };
}

export async function mountContainer(component: JSX.Element) {
  const wrapper = mount(component);
  const client = wrapper.find('Provider').prop('client') as ApolloClient<any>;

  await waitForQueries(client);

  return wrapper;
}

export async function waitForQueries(client: ApolloClientBase): Promise<any> {
  const spyLink: SpyLink = (client as ApolloClient<any>).spyLink;
  if (!spyLink) {
    throw new Error('You need to add SpyLink to your links!');
  }
  return await spyLink.wait();
}
