export const companyTypeDefs = /* GraphQL */ `

  type Company {
    id: ID!
    name: String!
    industry: String!
    size: Int!
    users: [User!]!
    createdAt: String!
    updatedAt: String!
    owner: User!
  }

  type PaginatedCompanies {
    items: [Company!]!
    total: Int!
    page: Int!
    limit: Int!
    hasNextPage: Boolean!
  }

  input CreateCompanyInput {
    name: String!
    industry: String!
    size: Int!
    contactName: String!
    contactEmail: String!
    contactPassword: String!
  }

  input UpdateCompanyInput {
    name: String
    industry: String
    size: Int
  }

  input CompanyFiltersInput {
    query: String
    industry: String
    size: Int
    page: Int
    limit: Int
  }

  extend type Query {
    findCompany(id: ID!): Company!
    getCompanies(filters: CompanyFiltersInput): PaginatedCompanies!
  }

  extend type Mutation {
    # Public — anyone can request a company; admin approves via email link
    createCompany(input: CreateCompanyInput!): CreateCompanyResponse!
    confirmCompany(token: String!): MessagePayload!

    # Protected — admin/root only
    updateCompany(id: ID!, input: UpdateCompanyInput!): Company!
    deleteCompany(id: ID!): Boolean!
  }
`;
