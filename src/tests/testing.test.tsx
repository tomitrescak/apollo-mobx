import date from 'apollo-module-date';
import { shallow } from 'enzyme';
import * as React from 'react';
import { compose, connectProps, shallowCompare } from '../index';
import { configure, initialiseApolloMocks } from '../testing/index';

describe('Testing', function() {
  it('test global resolvers', async function() {
    const globalTypeDefs = `
      scalar Date

      type Other {
        date: Date
        text: String
      }

      type Query {
        other: Other
      }

      schema {
        query: Query
      }
    `;

    const globalResolvers = date.resolvers;
    configure(globalTypeDefs, globalResolvers);

    const client = initialiseApolloMocks({
      resolvers: {
        Other: () => ({
          date: new Date(2010, 1, 1),
          text: 'Resolved'
        })
      }
    });

    interface Result {
      other: string;
    }
    const result = await client.query<Result>({
      query: gql`
        query other {
          other {
            date
            text
          }
        }
      `
    });

    result.data.other.should.deep.equal({ date: 1264942800000, text: 'Resolved', __typename: 'Other' });
  });

  it('compose: composes several functions', function() {
    function a(b: number) {
      return b + 2;
    }

    function m(n: number) {
      return n * 4;
    }

    const composed1 = compose(a, m);
    composed1(2).should.equal(10); // (2 * 4) + 2
    const composed2 = compose(m, a);
    composed2(2).should.equal(16); // (2 + 2) * 4

    // not composed
    compose()(3).should.equal(3);
    compose(a)(2).should.equal(4);
    compose(m)(2).should.equal(8);
  });

  it('connectProps: maps ownProps', function() {
    const a = () => <div />;
    const ownProps = {
      a: {
        b: 10
      }
    };
    const map = (props: typeof ownProps) => ({
      b: ownProps.a.b
    });

    const Component: any = connectProps(map)(a);
    const wrapper = shallow(<Component a={a} />);

    wrapper.prop('b').should.equal(10);
  });

  it('shallow compare compares two objects', function() {
    shallowCompare({ a: 1 }, { a: 1 }).should.be.true;
    shallowCompare({ a: 1 }, { a: 1, b: 1 }).should.be.false;
    shallowCompare({ a: 1, b: 1 }, { a: 1 }).should.be.false;
    shallowCompare(null, null).should.be.true;
    shallowCompare(null, 1).should.be.false;
  });
});
