export const GET_ME_QUERY = `
  query GetMe {
    me {
      id
      email
      firstName
      lastName
      role
      phone
      username
      alternatePhone
      dateOfBirth
      gender
      bio
      avatarUrl
      status
      createdAt
      updatedAt
    }
  }
`;

export const GET_USER_QUERY = `
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      email
      firstName
      lastName
      role
      phone
      username
      alternatePhone
      dateOfBirth
      gender
      bio
      avatarUrl
      status
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_USER_MUTATION = `
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      id
      email
      firstName
      lastName
      role
      phone
      username
      alternatePhone
      dateOfBirth
      gender
      bio
      avatarUrl
      status
      createdAt
      updatedAt
    }
  }
`;
