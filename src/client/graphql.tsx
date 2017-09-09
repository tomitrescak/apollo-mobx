import * as React from 'react';

import { action, computed, IObservableArray, observable } from 'mobx';
import { inject, observer } from 'mobx-react';

import { Cache } from 'apollo-cache-core';
import ApolloClient, { ObservableQuery } from 'apollo-client';
import { Subscription } from 'apollo-client/lib/src/util/Observable';
import { ApolloLink } from 'apollo-link-core';
import { DocumentNode } from 'graphql';
import { ApolloMobxClient } from './client';
import { ChildProps, ComponentDecorator, OperationOption } from './interface';
import { Observer } from './observer';

const uid = 0;

interface WProps { client: ApolloMobxClient<any> }

export function graphql<TResult = {}, TProps = {}, TChildProps = ChildProps<TProps, TResult>>(
  query: DocumentNode,
  { options, props = null, name = 'data' }: OperationOption<TProps, TResult> = {}
): ComponentDecorator<TProps, TChildProps> {
  return function(Wrapper) {
    @inject('client')
    @observer
    class Wrapped extends React.PureComponent<WProps, {}> {
      observe: Observer<any>;

      render() {
        const receivedData = {
          ...this.observe.data,
          loading: this.observe.loading,
          networkStatus: this.observe.networkStatus,
          version: this.observe.version
        };
        const modifiedProps = props ? props({ [name]: receivedData, ownProps: this.props } as any) : {};
        const newProps = {
          ...this.props,
          [name]: receivedData,
          ...modifiedProps
        };

        return <Wrapper {...newProps} />;
      }

      componentWillUpdate(nextProps: WProps) {
        const client = nextProps.client;
        const variables = options ? (options as any)(nextProps).variables : {};
        this.observe.start(client, query, { variables });
      }

      componentWillMount() {
        const client = this.props.client;

        this.observe = client.mobxQueryStore.createObservable();
        const variables = options ? (options as any)(this.props).variables : {};

        this.observe.start(client, query, { variables });
      }

      componentWillUnmount() {
        this.props.client.mobxQueryStore.removeObservable(this.observe);
      }
    }

    return Wrapped as any;
  };
}
