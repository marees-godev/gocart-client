export const GET_PRODUCT_RATINGS_QUERY = `
  query GetProductRatings($productId: ID!, $limit: Int, $offset: Int) {
    productRatings(productId: $productId, limit: $limit, offset: $offset) {
      total
      averageRating
      stars {
        fiveStar
        fourStar
        threeStar
        twoStar
        oneStar
      }
      ratings {
        id
        userId
        orderId
        rating
        review
        createdAt
      }
    }
  }
`;

export const CREATE_RATING_MUTATION = `
  mutation CreateRating($input: CreateRatingInput!) {
    createRating(input: $input) {
      id
      rating
      review
      createdAt
    }
  }
`;

export const UPDATE_RATING_MUTATION = `
  mutation UpdateRating($input: UpdateRatingInput!) {
    updateRating(input: $input) {
      id
      rating
      review
      updatedAt
    }
  }
`;

export const DELETE_RATING_MUTATION = `
  mutation DeleteRating($id: ID!) {
    deleteRating(id: $id) {
      success
      message
    }
  }
`;

export const FLAG_RATING_MUTATION = `
  mutation FlagRating($input: FlagRatingInput!) {
    flagRating(input: $input) {
      success
      message
    }
  }
`;
