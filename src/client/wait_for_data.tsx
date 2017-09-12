import * as React from 'react';
import { ApolloClient } from './client';
import { ComponentDecorator, CompositeComponent } from './interface';

export interface Options {
  loadingComponent?: () => JSX.Element;
}

export function waitForData<TProps, TChildProps = {}>(
  keys: string | string[] = ['data'],
  options: Options = {}
): (component: CompositeComponent<TProps>) => React.StatelessComponent<TProps> {
  if (typeof keys === 'string') {
    keys = [keys];
  }
  return function(WrappedComponent) {
    const func = (props: any, context: any) => {
      const loading = options.loadingComponent || props.client.loadingComponent;
      if (!loading) {
        throw new Error('Apollo-Mobx: Loading component for "waitForData" is not defined.');
      }

      // wait for individual queries
      for (let key of keys) {
        let selector: string;
        if (key.indexOf('.') >= 0) {
          const splitKey = key.split('.');
          key = splitKey[0];
          selector = splitKey[1];
        }

        if (!props[key]) {
          throw new Error('Loading container did not find key in the apollo result set: ' + key);
        }

        if (selector) {
          if (props[key][selector] == null) {
            return loading(...props);
          }
        } else if (props[key].loading) {
          return loading(...props);
        }
      }
      return <WrappedComponent {...props} />;
    };
    func.displayName = `WaitForLoad(${WrappedComponent.displayName || 'Component'})`;
    return func;
  };
}
