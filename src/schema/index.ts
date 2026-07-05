import { companyTypeDefs } from './company.schema';
import { projectTypeDefs } from './project.schema';
import { noteTypeDefs } from './note.schema';
import { timelineTypeDefs } from './timeline.schema';
import { userTypeDefs } from './user.schema';
import { authTypeDefs } from './auth.schema';
import { customTypeDefs } from './common.schema';
import { pushTokenTypeDefs } from './pushToken.schema';

const baseTypeDefs = /* GraphQL */ `
  type Query
  type Mutation
`;

// Order matters: types must be defined before they are referenced
export const typeDefs = [
  baseTypeDefs,
  companyTypeDefs,
  projectTypeDefs,
  noteTypeDefs,
  timelineTypeDefs,
  userTypeDefs,
  authTypeDefs,
  customTypeDefs,
  pushTokenTypeDefs
];
