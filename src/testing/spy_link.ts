import {
  ApolloLink,
  FetchResult,
  NextLink,
  Observable,
  Operation,
} from 'apollo-link';

import ApolloClient from 'apollo-client';
import { print } from 'graphql/language/printer';

/*
 * Expects context to contain the forceFetch field if no dedup
 */
export class SpyLink extends ApolloLink {
  private inFlightRequestObservables: {
    [key: string]: Observable<FetchResult>;
  };

  constructor() {
    super();
    this.inFlightRequestObservables = {};
  }

  public async wait() {
    return new Promise((resolve) => {
      const check = () => {
        if (Object.getOwnPropertyNames(this.inFlightRequestObservables).length === 0) {
          resolve();
        } else {
          setTimeout(check, 5);
        }
      };
      check();
    });
  }

  public request(
    operation: Operation,
    forward: NextLink,
  ): Observable<FetchResult> {
    const key = this.getKey(operation);
    if (!this.inFlightRequestObservables[key]) {
      this.inFlightRequestObservables[key] = forward(operation);
    }
    return new Observable<FetchResult>((observer) =>
      this.inFlightRequestObservables[key].subscribe({
        next: observer.next.bind(observer),
        error: (error) => {
          delete this.inFlightRequestObservables[key];
          observer.error(error);
        },
        complete: () => {
          delete this.inFlightRequestObservables[key];
          observer.complete();
        },
      }),
    );
  }

  private getKey(operation: Operation) {
    // XXX we're assuming here that variables will be serialized in the same order.
    // that might not always be true
    // return `${print(operation.query)}|${JSON.stringify(
    //   operation.variables,
    // )}|${operation.operationName}`;

    return print(operation.query);
  }
}
