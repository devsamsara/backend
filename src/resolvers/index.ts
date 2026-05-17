import { authResolvers } from './auth.resolver';
import { companyResolvers } from './company.resolver';
import { projectResolvers } from './project.resolver';
import { noteResolvers } from './note.resolver';
import { timelineResolvers } from './timeline.resolver';
import { userResolvers } from './user.resolver';

export const resolvers = {
  Query: {
    ...companyResolvers.Query,
    ...projectResolvers.Query,
    ...noteResolvers.Query,
    ...timelineResolvers.Query,
    ...userResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...companyResolvers.Mutation,
    ...projectResolvers.Mutation,
    ...noteResolvers.Mutation,
    ...timelineResolvers.Mutation,
    ...userResolvers.Mutation,
  },
};
