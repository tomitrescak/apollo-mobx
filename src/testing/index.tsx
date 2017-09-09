import InMemoryCache from 'apollo-cache-inmemory';
import { mount, ReactWrapper } from 'enzyme';
import { GraphQLScalarType } from 'graphql';
import { addMockFunctionsToSchema, makeExecutableSchema } from 'graphql-tools';
import { Kind } from 'graphql/language';
import { autorun } from 'mobx';
import { Provider as MobxProvider } from 'mobx-react';
import * as React from 'react';
import { ApolloMobxClient } from '../client/client';
import { ObserverStore } from '../client/observer_store';
import MockLink from './mock_link';

export interface ApolloProps<T> {
  resolvers?: any;
  typeDefs?: string;
  queries?: any;
  mutations?: any;
  reducers?: {};
  context?: T;
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
  context
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

  const graphqlClient = new ApolloMobxClient({
    cache: apolloCache,
    context,
    link: new MockLink({ schema }) as any,
  });
  graphqlClient.cache = apolloCache;
  return graphqlClient;
}

export function initialiseApolloDecorator<T>({
  queries = {},
  mutations = {},
  resolvers = {},
  reducers = {},
  typeDefs,
  context
}: ApolloProps<T>) {
  const graphqlClient = initialiseApolloMocks({ queries, mutations, resolvers, context, typeDefs });

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
  const client = wrapper.find('Provider').prop('client') as ApolloMobxClient<any>;

  await waitForQueries(client);

  return wrapper;
}

export async function waitForQueries<T>(client: ApolloMobxClient<T>): Promise<any> {
  const mobxQueryStore: ObserverStore<T> = client.mobxQueryStore;
  if (mobxQueryStore.activeQueries.length && mobxQueryStore.activeQueries.every((q) => !q.loading)) {
    return true;
  }
  return new Promise((resolve, reject) => {
    autorun(() => {
      const version = mobxQueryStore.version;
      if (mobxQueryStore.activeQueries.every((q) => !q.loading)) {
        resolve(version);
      }
    });
  });
}
