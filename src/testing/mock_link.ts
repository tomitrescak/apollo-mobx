import { ApolloLink, FetchResult, Observable, Operation } from 'apollo-link';

import { graphql, GraphQLSchema } from 'graphql';
// tslint:disable-next-line:no-submodule-imports
import { print } from 'graphql/language/printer';

export default class MockLink extends ApolloLink {
  schema: GraphQLSchema;
  rootValue: any;
  context: any;

  constructor(params?: { schema: any; rootValue?: any; context?: any }) {
    super();
    this.schema = params.schema;
    this.rootValue = params.rootValue;
    this.context = params.context;
  }

  public request(operation: Operation): Observable<FetchResult> | null {
    const request = {
      ...operation,
      query: print(operation.query)
    };

    return new Observable<FetchResult>((observer: any) => {
      graphql(this.schema, request.query, this.rootValue, this.context, request.variables, request.operationName)
        .then((data) => {
          if (!observer.closed) {
            observer.next(data);
            observer.complete();
          }
        })
        .catch((error) => {
          if (!observer.closed) {
            observer.error(error);
          }
        });
    });
  }
}
