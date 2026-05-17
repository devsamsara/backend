export const noteTypeDefs = /* GraphQL */ `

  type Note {
    id: ID!
    content: String!
    pinned: Boolean!
    author: User!
    project: Project!
    createdAt: String!
    updatedAt: String!
  }

  input CreateNoteInput {
    content: String!
    projectId: ID!
    pinned: Boolean
  }

  input UpdateNoteInput {
    content: String
    pinned: Boolean
  }

  extend type Query {
    findNote(id: ID!): Note!
    getNotesByProject(projectId: ID!): [Note!]!
    getPinnedNotes(projectId: ID!): [Note!]!
  }

  extend type Mutation {
    createNote(input: CreateNoteInput!): Note!
    updateNote(id: ID!, input: UpdateNoteInput!): Note!
    deleteNote(id: ID!): Boolean!
    togglePinNote(id: ID!): Note!
  }
`;
