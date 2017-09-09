import { observer } from 'mobx-react';
import * as React from 'react';

export function shallowCompare(a: any, b: any) {
  if (!a && !b) {
    return true;
  }

  if ((a && !b) || (!a && b)) {
    return false;
  }

  let ka = 0;
  let kb = 0;

  // tslint:disable-next-line:forin
  for (const key of Object.getOwnPropertyNames(a)) {
    if (a[key] !== b[key]) {
      return false;
    }
    ka++;
  }

  for (const key of Object.getOwnPropertyNames(b)) {
    kb++;
  }

  return ka === kb;
}

/**
 * Composes single-argument functions from right to left. The rightmost
 * function can take multiple arguments as it provides the signature for
 * the resulting composite function.
 *
 * @param {...Function} funcs The functions to compose.
 * @returns {Function} A function obtained by composing the argument functions
 * from right to left. For example, compose(f, g, h) is identical to doing
 * (...args) => f(g(h(...args))).
 */

export function compose<T>(...funcs: any[]): (arg: any) => React.StatelessComponent<T> {
  if (funcs.length === 0) {
    return (arg: any) => arg;
  }
  if (funcs.length === 1) {
    return funcs[0];
  }
  return funcs.reduce((a, b) => (...args: any[]) => a(b(...args)));
}

export function connectProps<C>(mapStateToProps: (ownProps?: any) => object) {
  return function wrapWithConnect<P>(
    WrappedComponent: React.ComponentClass<P> | React.StatelessComponent<P>
  ): React.StatelessComponent<C> {
    const func = (props: any) => <WrappedComponent {...props} {...mapStateToProps(props)} />;
    func.displayName = `Connect(${WrappedComponent.displayName || 'Component'})`;
    return observer(func) as any;
  };
}
