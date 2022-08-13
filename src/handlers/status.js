// Create a DocumentClient that represents the query to add an item
exports.statusHandler = async (event) => {
  if (event.httpMethod !== "GET") {
    throw new Error(
      `statusHandler only accept GET method, you tried: ${event.httpMethod}`
    );
  }
  // All log statements are written to CloudWatch
  console.info("received:", event);

  const response = {
    statusCode: 200,
  };

  // All log statements are written to CloudWatch
  console.info(
    `response from: ${event.path} statusCode: ${response.statusCode}`
  );
  return response;
};
