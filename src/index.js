const { ApolloServer, SchemaDirectiveVisitor } = require('apollo-server');
const typeDefs = require('./typedefs');
const resolvers = require('./resolvers');
const {
  FormateDateDirective,
  AuthenticanDirective,
  AUthorizationDirective,
} = require('./directives');
const { defaultFieldResolver, GraphQLString } = require('graphql');
const { createToken, getUserFromToken } = require('./auth');
const db = require('./db');

class LogDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const resolver = field.resolve || defaultFieldResolver;
    const { message } = this.args;
    field.args.push({
      type: GraphQLString,
      name: 'message',
    });

    field.resolve = (root, { message, ...rest }, context, info) => {
      const { message: schmaMessage } = this.args;
      console.log('yo', message || schmaMessage);
      return resolver.call(this, root, rest, context, info);
    };
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  schemaDirectives: {
    log: LogDirective,
    formatDate: FormateDateDirective,
    authentication: AuthenticanDirective,
    authorization: AUthorizationDirective,
  },
  formatError(e) {
    return e;
  },
  context({ req, connection }) {
    const context = { ...db };
    if (connection) {
      return { ...context, ...connection.context };
    }

    const token = req.headers.authorization;
    const user = getUserFromToken(token);
    return { ...context, user, createToken };
  },
  subscriptions: {
    onConnect(params) {
      const token = params.authorization;
      const user = getUserFromToken(token);
      if (!user) {
        throw new Error('nope');
      }
      return { user };
    },
  },
});

server.listen(4000).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
