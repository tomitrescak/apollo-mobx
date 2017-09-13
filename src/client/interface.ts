import ApolloClient, {
  ApolloError,
  ApolloQueryResult,
  FetchMoreOptions,
  FetchMoreQueryOptions,
  FetchPolicy,
  ObservableQuery,
  SubscribeToMoreOptions,
  UpdateQueryOptions
} from 'apollo-client';
import { action, computed, IObservableArray, observable } from 'mobx';
import { inject, observer } from 'mobx-react';

export interface QueryProps {
  error?: ApolloError;
  networkStatus: number;
  loading: boolean;
  variables: {
    [variable: string]: any;
  };
  fetchMore: (fetchMoreOptions: FetchMoreQueryOptions & FetchMoreOptions) => Promise<ApolloQueryResult<any>>;
  refetch: (variables?: any) => Promise<ApolloQueryResult<any>>;
  startPolling: (pollInterval: number) => void;
  stopPolling: () => void;
  subscribeToMore: (options: SubscribeToMoreOptions) => () => void;
  updateQuery: (mapFn: (previousQueryResult: any, options: UpdateQueryOptions) => any) => void;
}

export type ChildProps<P, R> = P & {
  data?: QueryProps & R;
};

export interface QueryOpts {
  ssr?: boolean;
  variables?: { [key: string]: any };
  fetchPolicy?: FetchPolicy;
  pollInterval?: number;
  client?: ApolloClient;
  notifyOnNetworkStatusChange?: boolean;
  // deprecated
  skip?: boolean;
}

export interface OptionProps<TProps, TResult> {
  ownProps: TProps;
  data?: QueryProps & TResult;
}

export interface OperationOption<TProps, TResult> {
  options?: QueryOpts | ((props: TProps) => QueryOpts);
  props?: (props: OptionProps<TProps, TResult>) => any;
  skip?: boolean | ((props: any) => boolean);
  name?: string;
  withRef?: boolean;
  shouldResubscribe?: (props: TProps, nextProps: TProps) => boolean;
  alias?: string;
  waitForData?: boolean;
  loadingComponent?: () => JSX.Element;
}

export type CompositeComponent<P> = React.ComponentClass<P> | React.StatelessComponent<P>;
export type ComponentDecorator<TOwnProps, TMergedProps> = (
  component: CompositeComponent<TMergedProps>
) => React.ComponentClass<TOwnProps>;

export interface Options<TData, TProps> {
  props?: (data: TData) => any;
  name?: string;
  options?: (
    props: TProps
  ) => {
    variables?: any;
  };
}
