import * as React from 'react';

import { action, computed, IObservableArray, observable } from 'mobx';
import { inject, observer } from 'mobx-react';

import ApolloClientBase, { ObservableQuery } from 'apollo-client';
import { ApolloLink } from 'apollo-link';
// import { DocumentNode } from 'graphql';
import { ApolloClient } from './client';
import { ChildProps, ComponentDecorator, OperationOption, QueryOpts } from './interface';
import { Observer } from './observer';

const uid = 0;

interface WProps {
  client: ApolloClient<any>;
}

export function graphql<DataResult = {}, QueryProps = {}, TChildProps = ChildProps<QueryProps, DataResult>>(
  query: any,
  { options, props = null, name = 'data', waitForData, loadingComponent }: OperationOption<QueryProps, DataResult> = {}
): ComponentDecorator<QueryProps, TChildProps> {
  return function(Wrapper) {
    @inject('client')
    @observer
    class ApolloWrappedContainer extends React.Component<WProps, {}> {
      observe: Observer<any>;

      readOptions(options: QueryOpts | ((props: QueryOpts) => QueryOpts), props: WProps): QueryOpts {
        if (typeof options === 'function') {
          return options(props);
        } else {
          return options;
        }
      }

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

        // we may request that we want to render only loading component until data is loaded
        if (receivedData.loading && waitForData) {
          const loading = loadingComponent ? loadingComponent() : this.props.client.loadingComponent();
          if (!loading) {
            throw new Error('Apollo-Mobx: Loading component for "waitForData" is not defined.');
          }
          return loading;
        }

        return <Wrapper {...newProps} />;
      }

      componentWillUpdate(nextProps: WProps) {
        const client = nextProps.client;
        const opts = this.readOptions(options, nextProps) || {};
        this.observe.start(client, query, opts);
      }

      componentWillMount() {
        const client = this.props.client;

        this.observe = new Observer();

        const opts = this.readOptions(options, this.props) || {};
        this.observe.start(client, query, opts);
      }
    }

    return ApolloWrappedContainer as any;
  };
}
