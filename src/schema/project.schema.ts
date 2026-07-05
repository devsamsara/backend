export const projectTypeDefs = /* GraphQL */ `
  enum ProjectStatus {
    active
    ongoing
    paused
    completed
    canceled
    archived
  }

  type Photo {
    id: ID!
    url: String!
    createdAt: String!
    tags: [String]
    caption: String!
  }

  type Project {
    id: ID!
    name: String!
    location: String!
    latitude: Float
    longitude: Float
    thumbnail: String
    description: String!
    status: ProjectStatus!
    progress: Int!
    tags: [String!]!
    startDate: String!
    endDate: String
    members: [User!]!
    photos: [Photo!]!
    notes: [Note!]!
    timeline: [TimelineEvent!]
    createdAt: String!
    updatedAt: String
  }

  type PaginatedProjects {
    items: [Project!]!
    total: Int!
    page: Int!
    limit: Int!
    hasNextPage: Boolean!
  }

  input CreateProjectInput {
    name: String!
    location: String!
    latitude: Float!
    longitude: Float!
    thumbnail: String
    description: String
    startDate: String
    endDate: String
    memberIds: [ID!]
  }

  input UpdateProjectInput {
    name: String
    location: String
    latitude: Float
    longitude: Float
    thumbnail: String
    description: String
    tags: [String]
    status: String
    progress: Int
    startDate: String
    endDate: String
  }

  input ProjectFiltersInput {
    query: String
    status: String
    page: Int
    limit: Int
  }

  type UploadUrlPayload {
    uploadUrl: String!
    fileUrl: String!
  }

  extend type Query {
    findProject(id: ID!): Project!
    getProjects(filters: ProjectFiltersInput): PaginatedProjects!
    getMyProjects: [Project!]!
    getUploadUrl(
      projectId: ID
      fileName: String!
      mimeType: String!
    ): UploadUrlPayload!
  }

  extend type Mutation {
    createProject(input: CreateProjectInput!): Project!
    updateProject(id: ID!, input: UpdateProjectInput!): Project!
    deleteProject(id: ID!): Boolean!
    addProjectMember(projectId: ID!, userId: ID!): Project!
    removeProjectMember(projectId: ID!, userId: ID!): Project!
    updateProjectProgress(id: ID!, progress: Int!): Project!
    updatePhoto(id: ID!, url: String, caption: String, tags: [String!]): Photo!
    addPhoto(
      projectId: ID!
      url: String!
      caption: String
      tags: [String!]
    ): Photo!
    deletePhoto(id: ID!): Boolean!
  }
`;
