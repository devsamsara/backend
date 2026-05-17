export const authTypeDefs = /* GraphQL */ `
  type AuthPayload {
    token: String!
    refreshToken: String!
    user: User!
  }

  type MessagePayload {
    message: String!
  }

  input RegisterInput {
    name: String!
    lastName: String!
    email: String!
    password: String!
    companyId: String!
    role: UserRole
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input ForgotPasswordInput {
    email: String!
  }

  input ResetPasswordInput {
    token: String!
    newPassword: String!
  }

  input ChangePasswordInput {
    currentPassword: String!
    newPassword: String!
  }

  extend type Mutation {
    # Public
    register(input: RegisterInput!): AuthPayload!
    confirmAccount(token: String!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    forgotPassword(input: ForgotPasswordInput!): Boolean!
    resetPassword(input: ResetPasswordInput!): AuthPayload!

    # Protected
    changePassword(input: ChangePasswordInput!): Boolean!
  }
`;
