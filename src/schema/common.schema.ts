export const customTypeDefs = /* GraphQL */ `

  interface DefaultResponse {
    code: String!
    success: Boolean!
    message: String!
  }

  type CreateCompanyResponse implements  DefaultResponse{
    code: String!
    success: Boolean!
    message: String!
    company: Company!
    token: String!
    refreshToken: String!
    user: User!
  }
`;
