export const timelineTypeDefs = /* GraphQL */ `

  enum TimelineEventType {
    photo
    note
    milestone
    team
  }

  type TimelineEvent {
    id: ID!
    title: String!
    description: String!
    type: TimelineEventType!
    photoUrl: String
    project: Project!
    createdAt: String!
    updatedAt: String!
  }

  input CreateTimelineEventInput {
    title: String!
    description: String!
    type: TimelineEventType!
    photoUrl: String
    projectId: ID!
  }

  input UpdateTimelineEventInput {
    title: String
    description: String
    type: TimelineEventType
    photoUrl: String
  }

  input TimelineFiltersInput {
    type: TimelineEventType
  }

  extend type Query {
    findTimelineEvent(id: ID!): TimelineEvent!
    getProjectTimeline(projectId: ID!, filters: TimelineFiltersInput): [TimelineEvent!]!
  }

  extend type Mutation {
    createTimelineEvent(input: CreateTimelineEventInput!): TimelineEvent!
    updateTimelineEvent(id: ID!, input: UpdateTimelineEventInput!): TimelineEvent!
    deleteTimelineEvent(id: ID!): Boolean!
  }
`;
