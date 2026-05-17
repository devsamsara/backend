export const userTypeDefs = /* GraphQL */ `
  enum UserRole {
    admin
    user
    root
  }

  enum UserStatus {
    active
    inactive
    banned
  }

  type User {
    id: ID!
    name: String!
    lastName: String
    email: String!
    role: UserRole!
    status: UserStatus!
    lastLoginAt: String
    company: Company
    projects: [Project]
    createdAt: String!
    updatedAt: String!
    avatarUrl: String
    phone: String
    nickname: String
  }

  type PaginatedUsers {
    items: [User!]!
    total: Int!
    page: Int!
    limit: Int!
    hasNextPage: Boolean!
  }

  input UpdateUserInput {
    name: String
    email: String
    status: UserStatus
    role: UserRole,
    phone: String
    company: String
  }

  input UserFiltersInput {
    query: String
    roleFilter: UserRole
    stateFilter: UserStatus
    page: Int
    limit: Int
    filterMe: Boolean
  }

  extend type Query {
    me: User!
    findUser(id: ID!): User!
    getUsers(filters: UserFiltersInput): PaginatedUsers!
  }

  extend type Mutation {
    updateUser(id: ID!, input: UpdateUserInput!): User!
    updateUserPicture(userId: ID!, picture: String!): User!
    deleteUser(id: ID!): Boolean!
  }
`;
