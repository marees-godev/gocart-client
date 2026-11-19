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
