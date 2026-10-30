export const GET_USER_ADDRESSES_QUERY = `
  query GetUserAddresses($userId: ID!) {
    userAddresses(userId: $userId) {
      id
      userId
      label
      fullName
      phoneNumber
      emailAddress
      addressLine
      city
      state
      postalCode
      country
      isDefault
      createdAt
      updatedAt
    }
  }
`;

export const GET_USER_ADDRESS_QUERY = `
  query GetUserAddress($id: ID!) {
    userAddress(id: $id) {
      id
      userId
      label
      fullName
      phoneNumber
      emailAddress
      addressLine
      city
      state
      postalCode
      country
      isDefault
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_USER_ADDRESS_MUTATION = `
  mutation CreateUserAddress($userId: ID!, $input: CreateAddressInput!) {
    createUserAddress(userId: $userId, input: $input) {
      id
      userId
      label
      fullName
      phoneNumber
      emailAddress
      addressLine
      city
      state
      postalCode
      country
      isDefault
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_USER_ADDRESS_MUTATION = `
  mutation UpdateUserAddress($id: ID!, $input: UpdateAddressInput!) {
    updateUserAddress(id: $id, input: $input) {
      id
      userId
      label
      fullName
      phoneNumber
      emailAddress
      addressLine
      city
      state
      postalCode
      country
      isDefault
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_USER_ADDRESS_MUTATION = `
  mutation DeleteUserAddress($id: ID!) {
    deleteUserAddress(id: $id)
  }
`;

export const SET_DEFAULT_USER_ADDRESS_MUTATION = `
  mutation SetDefaultUserAddress($id: ID!) {
    setDefaultUserAddress(id: $id) {
      id
      userId
      label
      fullName
      phoneNumber
      emailAddress
      addressLine
      city
      state
      postalCode
      country
      isDefault
      createdAt
      updatedAt
    }
  }
`;
