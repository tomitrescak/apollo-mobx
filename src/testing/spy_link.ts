import { ApolloLink, FetchResult, NextLink, Observable, Operation } from 'apollo-link';

import ApolloClient from 'apollo-client';
// tslint:disable-next-line:no-submodule-imports
import { print } from 'graphql/language/printer';

/*
 * Expects context to contain the forceFetch field if no dedup
 */
export class SpyLink extends ApolloLink {
  private inFlightRequestObservables: Map<string, Observable<FetchResult>> = new Map();
  private subscribers: Map<string, any> = new Map();

  constructor() {
    super();
  }

  public async wait() {
    return new Promise((resolve) => {
      const check = () => {
        if (this.inFlightRequestObservables.size === 0) {
          resolve();
        } else {
          setTimeout(check, 5);
        }
      };
      check();
    });
  }

  public request(operation: Operation, forward: NextLink): Observable<FetchResult> {
    const key = operation.toKey();

    const cleanup = (cleanupKey: any) => {
      this.inFlightRequestObservables.delete(cleanupKey);
      const prev = this.subscribers.get(cleanupKey);
      return prev;
    };

    if (!this.inFlightRequestObservables.get(key)) {
      // this is a new request, i.e. we haven't deduplicated it yet
      // call the next link
      const singleObserver = forward(operation);
      let subscription: any;

      const sharedObserver = new Observable((observer: any) => {
        // this will still be called by each subscriber regardless of
        // de-duplication status
        let prev = this.subscribers.get(key);
        if (!prev) {
          prev = { next: [], error: [], complete: [] };
        }

        this.subscribers.set(key, {
          complete: prev.complete.concat([observer.complete.bind(observer)]),
          error: prev.error.concat([observer.error.bind(observer)]),
          next: prev.next.concat([observer.next.bind(observer)])
        });

        if (!subscription) {
          subscription = singleObserver.subscribe({
            complete: () => {
              delete (this.inFlightRequestObservables as any)[key];
              observer.complete();
            },
            error: (error: any) => {
              const prevCleanup = cleanup(key);
              this.subscribers.delete(key);
              if (prevCleanup) {
                prevCleanup.error.forEach((err: any) => err(error));
              }
            },
            next: (result: any) => {
              const prevCleanup = cleanup(key);
              this.subscribers.delete(key);
              if (prevCleanup) {
                prevCleanup.next.forEach((next: any) => next(result));
                prevCleanup.complete.forEach((complete: any) => complete());
              }
            }
          });
        }

        return () => {
          if (subscription) {
            subscription.unsubscribe();
          }
          this.inFlightRequestObservables.delete(key);
        };
      });

      this.inFlightRequestObservables.set(key, sharedObserver);
    }

    // return shared Observable
    return this.inFlightRequestObservables.get(key);
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
