import { ObservableQuery } from 'apollo-client';
import { Subscription } from 'apollo-client/lib/src/util/Observable';
import { DocumentNode } from 'graphql';
import { action, observable } from 'mobx';
import * as React from 'react';
import { ApolloMobxClient } from './client';
import { shallowCompare } from './utils';

export class Observer<T> {
  data = {};
  @observable loading = true;
  @observable networkStatus = 0;
  @observable version = 0;

  subscription: Subscription;
  query: ObservableQuery<any>;
  client: ApolloMobxClient<T>;
  variables: any;

  start(client: any, query: DocumentNode, { variables, ...options }: any) {
    if (this.client !== client) {
      this.client = client;
      this.cleanup();
    } else if (!shallowCompare(this.variables, variables)) {
      this.loading = true;
      this.variables = variables;
      this.cleanup();
    } else if (this.query) {
      return;
    }

    return new Promise(() => {
      this.loading = true;
      this.query = client.watchQuery({ query, variables, ...options });
      this.query.options.notifyOnNetworkStatusChange = true;

      const applyChanges = action((res: any) => {
        // debugger;
        this.data = res.data;
        this.loading = res.loading;
        this.networkStatus = res.networkStatus;
        this.version++;
      });

      this.subscription = this.query.subscribe({
        next(result) {
          // setTimeout(() => applyChanges(result), 1);
          applyChanges(result);
        },
        error(err) {
          // tslint:disable-next-line:no-console
          console.error('err', err);
        }
      });
    });
  }

  @action
  finish() {
    this.loading = false;
    this.networkStatus = 0;
  }

  cleanup() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
