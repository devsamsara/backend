export const pushTokenTypeDefs = /* GraphQL */ `
  input NotificationInput {
    title: String!
    body: String!
    forAll: Boolean!
  }

  type PushToken {
    id: ID!
    token: String!
    platform: String
    enabled: Boolean!
    createdAt: String!
  }

  type PushTokenResponse {
    code: Int!
    success: Boolean!
    message: String!
    enabled: Boolean!
    token: String!
  }
  extend type Query {
    isPushTokenEnabled(token: String!): Boolean!
  }
  extend type Mutation {
    registerPushToken(token: String!, platform: String!): PushTokenResponse!
    removePushToken(token: String!): PushTokenResponse!
    togglePushToken(token: String!, enabled: Boolean!): PushTokenResponse!
    sendNotification(notification: NotificationInput!): PushTokenResponse!
  }
`;
