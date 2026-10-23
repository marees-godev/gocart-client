export const CREATE_STORE_MUTATION = `
  mutation CreateStore($input: CreateStoreInput!) {
    createStore(input: $input) {
      id
      name
      username
      status
    }
  }
`
export const GET_USER_STORE_QUERY = `
  query GetMyStore {
    myStore {
      id
      name
      username
      status
    }
  }
`;