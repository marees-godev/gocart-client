// GraphQL queries for Personalization matching GoCart Backend schema

export const GET_CUSTOMER_ACTIVITIES_QUERY = `
  query CustomerActivities($sessionId: String, $limit: Int, $offset: Int) {
    customerActivities(sessionId: $sessionId, limit: $limit, offset: $offset) {
      id
      userId
      sessionId
      eventType
      productId
      categoryId
      createdAt
    }
  }
`;

export const GET_RECENTLY_VIEWED_PRODUCTS_QUERY = `
  query RecentlyViewedProducts($sessionId: String, $limit: Int, $offset: Int) {
    recentlyViewedProducts(sessionId: $sessionId, limit: $limit, offset: $offset) {
      products {
        productId
        lastViewedAt
      }
      total
    }
  }
`;

export const GET_CATEGORY_PREFERENCES_QUERY = `
  query CategoryPreferences($sessionId: String, $limit: Int, $offset: Int) {
    categoryPreferences(sessionId: $sessionId, limit: $limit, offset: $offset) {
      categoryId
      score
    }
  }
`;
