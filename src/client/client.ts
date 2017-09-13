import { ApolloCache } from 'apollo-cache-core';
import ApolloClientBase, { ApolloError, MutationOptions, NetworkStatus, WatchQueryOptions } from 'apollo-client';
import { ApolloLink } from 'apollo-link-core';
import { DocumentNode } from 'graphql';
import * as React from 'react';
import { SpyLink } from '../testing/spy_link';

export interface IQuery<C = {}, D = {}, V = {}> extends WatchQueryOptions {
  variables?: V;
  thenCallback?: (data: D, context: C) => void;
  catchCallback?: (error: ApolloError, context: C) => void;
  finalCallback?: (context: C) => void;
}

export interface IMutation<C = {}, D = {}, V = {},  T = {}> extends MutationOptions<T> {
  variables?: V;
  thenCallback?: (data: D, context: C) => void;
  catchCallback?: (error: ApolloError, context: C) => void;
  finalCallback?: (context: C) => void;
}

export interface Options<T> {
  link: ApolloLink;
  cache: ApolloCache;
  ssrMode?: boolean;
  ssrForceFetchDelay?: number;
  addTypename?: boolean;
  connectToDevTools?: boolean;
  queryDeduplication?: boolean;
  context?: T;
  loadingComponent?: (props?: any) => JSX.Element;
}

export class ApolloClient<C> extends ApolloClientBase {
  spyLink: SpyLink;
  context: C;
  loadingComponent?: (props?: any) => JSX.Element;

  constructor(options: Options<C>) {
    super(options);
    this.context = options.context;
    this.loadingComponent = options.loadingComponent;
  }

  mutate<D, V = {}>(
    options: IMutation<C, V, D>
  ): Promise<{
    data: D;
    loading: boolean;
    networkStatus: NetworkStatus;
    stale: boolean;
  }> {
    const {
      catchCallback,
      finalCallback,
      mutation,
      optimisticResponse,
      thenCallback,
      updateQueries,
      variables,
    } = options;

    return new Promise((resolve, reject) => {

      if (!thenCallback && !catchCallback && !finalCallback) {
        super.mutate(options).then((result) => {
          resolve(result);
        }).catch((error) => {
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

          reject(error);
        });
    });
  }

  query<D, V = {}>(
    options: IQuery<C, D, V>
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

          reject(error);
        });
    });
  }
}
