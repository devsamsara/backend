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

  type ProjectStatusData {
    nameKey: String!
    count: Int!
    color: String!
  }

  type UserSummary {
    id: ID!
    name: String!
    avatarUrl: String
  }

  type RecentProject {
    id: ID!
    name: String!
    location: String!
    progress: Int!
    status: String!
    documentsCount: Int!
    commentsCount: Int!
    createdAt: String!
    members: [UserSummary]!
  }

  type RecentLocation {
    id: ID!
    name: String!
    projectsCount: Int!
    lastVisit: String!
    latitude: String!
    longitude: String!
  }

  type RecentImage {
    id: ID!
    projectName: String!
    url: String!
    date: String!
  }

  type PaginatedCompanies {
    items: [Company!]!
    total: Int!
    page: Int!
    limit: Int!
    hasNextPage: Boolean!
  }
  # ─── Dashboard root type ──────────────────────────────────────────────────────
  type DashboardData {
    currentCompany: Company!
    projectStatusData: [ProjectStatusData]!
    recentProjects: [RecentProject!]!
    recentLocations: [RecentLocation!]!
    recentImages: [RecentImage!]!
  }

  # ─── Company members types ───────────────────────────────────────────────────

  type MemberProject {
    id: ID!
    name: String!
    status: String!
    progress: Int!
  }

  type CompanyMember {
    id: ID!
    name: String!
    role: String!
    avatarUrl: String
    isOnline: Boolean!
    projects: [MemberProject!]!
  }

  type CompanyMembersData {
    members: [CompanyMember!]!
    totalProjects: Int!
    onlineCount: Int!
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

  input InviteMemberInput {
    name: String!
    email: String!
    role: UserRole
    projectId: ID!
  }

  extend type Query {
    findCompany(id: ID!): Company!
    getCompanies(filters: CompanyFiltersInput): PaginatedCompanies!
    getDashboardData: DashboardData!
    getCompanyMembers: CompanyMembersData!
    inviteMember(input: InviteMemberInput!): Boolean!
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
