export const LOGIN_MUTATION = `
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        name
        email
        role
        store {
          id
          name
          status
        }
      }
    }
  }
`;

export const REGISTER_MUTATION = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
    }
  }
`;
