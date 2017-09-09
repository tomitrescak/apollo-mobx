import { Cache } from 'apollo-cache-core';
import ApolloClient, { ApolloError, MutationOptions, WatchQueryOptions } from 'apollo-client';
import { NetworkStatus } from 'apollo-client/lib/src/core/networkStatus';
import { ApolloLink } from 'apollo-link-core';
import { DocumentNode } from 'graphql';
import * as React from 'react';
import { ObserverStore } from './observer_store';

export interface IQuery<D, V, C> extends WatchQueryOptions {
  variables?: V;
  thenCallback?: (data: D, context: C) => void;
  catchCallback?: (error: ApolloError, context: C) => void;
  finalCallback?: (context: C) => void;
}

export interface IMutation<C, V, D, T = { [key: string]: any }> extends MutationOptions<T> {
  query?: DocumentNode;
  variables?: V;
  thenCallback?: (data: D, context: C) => void;
  catchCallback?: (error: ApolloError, context: C) => void;
  finalCallback?: (context: C) => void;
}

export interface Options<T> {
  link: ApolloLink;
  cache: Cache;
  ssrMode?: boolean;
  ssrForceFetchDelay?: number;
  addTypename?: boolean;
  connectToDevTools?: boolean;
  queryDeduplication?: boolean;
  context?: T;
}

export class ApolloMobxClient<C> extends ApolloClient {
  mobxQueryStore = new ObserverStore<C>();
  context: C;

  constructor(options: Options<C>) {
    super(options);

    this.context = options.context;
  }

  mutate<V, D>(
    options: IMutation<C, V, D>
  ): Promise<{
    data: D;
    loading: boolean;
    networkStatus: NetworkStatus;
    stale: boolean;
  }> {
    options.mutation = options.mutation || options.query;
    const {
      catchCallback,
      finalCallback,
      mutation,
      optimisticResponse,
      query,
      thenCallback,
      updateQueries,
      variables,
    } = options;

    return new Promise((resolve, reject) => {
      // we will watch for the end of mutation
      const watchMutation = this.mobxQueryStore.createObservable();

      if (!thenCallback && !catchCallback && !finalCallback) {
        super.mutate(options).then((result) => {
          this.mobxQueryStore.removeObservable(watchMutation);
          resolve(result);
        }).catch((error) => {
          this.mobxQueryStore.removeObservable(watchMutation);
          reject(error);
        });
        return;
      }

      super
        .mutate<D>({
          mutation,
          optimisticResponse,
          updateQueries,
          variables,
        })
        .then((graphQLResult) => {
          const { data } = graphQLResult;

          if (data && thenCallback) {
            thenCallback(data as any, this.context);
          }

          if (finalCallback) {
            finalCallback(this.context);
          }

          this.mobxQueryStore.removeObservable(watchMutation);

          resolve(graphQLResult);
        })
        .catch((error: ApolloError) => {
          // context.Utils.log.error(error);
          if (catchCallback) {
            catchCallback(error, this.context);
          }
          if (finalCallback) {
            finalCallback(this.context);
          }

          this.mobxQueryStore.removeObservable(watchMutation);

          reject(error);
        });
    });
  }

  query<D, V = {}>(
    options: IQuery<D, V, C>
  ): Promise<{
    data: D;
    loading: boolean;
    networkStatus: NetworkStatus;
    stale: boolean;
  }> {
    const { query, variables, thenCallback, catchCallback, finalCallback } = options;

    // call original mutation if required`
    if (!thenCallback && !catchCallback && !finalCallback) {
      return super.query<D>(options);
    }

    return new Promise((resolve, reject) => {
      // we will watch for the end of mutation
      const watchMutation = this.mobxQueryStore.createObservable();

      super
        .query<D>({
          query,
          variables
        })
        .then((graphQLResult) => {
          const { data } = graphQLResult;

          if (data && thenCallback) {
            thenCallback(data, this.context);
          }

          if (finalCallback) {
            finalCallback(this.context);
          }

          this.mobxQueryStore.removeObservable(watchMutation);

          resolve(graphQLResult);
        })
        .catch((error: ApolloError) => {
          // context.Utils.log.error(error);
          if (catchCallback) {
            catchCallback(error, this.context);
          }
          if (finalCallback) {
            finalCallback(this.context);
          }

          this.mobxQueryStore.removeObservable(watchMutation);

          reject(error);
        });
    });
  }
}
