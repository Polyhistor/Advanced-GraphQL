const {
  SchemaDirectiveVisitor,
  AuthenticationError,
} = require('apollo-server');
const { defaultFieldResolver, GraphQLString } = require('graphql');
const { formatDate } = require('./utils');

class FormateDateDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const resolver = field.resolve || defaultFieldResolver;
    const { format: defaultFormat } = this.args;

    field.args.push({
      name: 'format',
      type: GraphQLString,
    });

    field.resolve = async (root, { format, ...rest }, context, info) => {
      const result = await resolver.call(this, root, rest, context, info);
      return formatDate(result, format || defaultFormat);
    };

    field.type = GraphQLString;
  }
}

class AUthorizationDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const resolver = field.resolve || defaultFieldResolver;
    const { role } = this.args;
    field.resolve = async (root, args, context, info) => {
      if (context.user.role !== role) {
        throw new AuthenticationError('not authenticated');
      }

      return resolver(root, args, context, info);
    };
  }
}

class AuthenticanDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const resolver = field.resolve || defaultFieldResolver;

    field.resolve = async (root, args, context, info) => {
      if (!context.user) {
        throw new AuthenticationError('not authenticated');
      }

      return resolver(root, args, context, info);
    };
  }
}

module.exports = {
  FormateDateDirective,
  AuthenticanDirective,
  AUthorizationDirective,
};
