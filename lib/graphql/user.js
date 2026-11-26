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

export const GET_LOCATION_BY_PINCODE_QUERY = `
  query LocationByPincode($pincode: String!, $country: String) {
    locationByPincode(pincode: $pincode, country: $country) {
      pincode
      country
      state
      district
      postOffices {
        name
        branchType
        deliveryStatus
        circle
        district
        division
        region
        state
        country
        pincode
      }
    }
  }
`;

export const DEACTIVATE_ACCOUNT_MUTATION = `
  mutation DeactivateAccount($input: DeactivateAccountInput) {
    deactivateAccount(input: $input) {
      success
      message
      status
    }
  }
`;

export const REACTIVATE_ACCOUNT_MUTATION = `
  mutation ReactivateAccount {
    reactivateAccount {
      success
      message
      status
    }
  }
`;

export const DELETE_ACCOUNT_MUTATION = `
  mutation DeleteAccount($input: DeleteAccountInput) {
    deleteAccount(input: $input) {
      success
      message
      status
    }
  }
`;
