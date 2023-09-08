// Create clients and set shared const values outside of the handler.

// Create a DocumentClient that represents the query to add an item
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

// Get the DynamoDB table name from environment variables
const tableName = process.env.USERS_TABLE;

export const signInOutHandler = async (event) => {
  const headers = {
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Origin": "*", // Allow from anywhere
    "Access-Control-Allow-Methods": "*", // Allow only GET request
  };

  try {
    if (event.httpMethod !== "PUT") {
      return {
        statusCode: 405,
        body: JSON.stringify({ message: "Method Not Allowed" }),
      };
    }

    console.info("Received:", event);

    const { email, password, isSigningIn } = JSON.parse(event.body);

    if (isSigningIn) {
      if (!email || !password) {
        return {
          headers,
          statusCode: 400,
          body: JSON.stringify({
            message: "Bad Request - Missing email or password",
          }),
        };
      }
    }
    // Check if the user exists
    const emailIdResult = await ddbDocClient.send(
      new GetCommand({
        TableName: tableName,
        Key: {
          id: `email#${email}`,
        },
      })
    );
    console.info("emailIdResult", emailIdResult);
    if (!emailIdResult.Item) {
      return {
        headers,
        statusCode: 404,
        body: JSON.stringify({ message: "User not found" }),
      };
    }

    const userId = emailIdResult.Item.userId;
    console.info("userId", userId);

    // Retrieve user data
    const fullUserResult = await ddbDocClient.send(
      new GetCommand({
        TableName: tableName,
        Key: {
          id: userId,
        },
      })
    );

    const user = fullUserResult.Item;
    console.info("user", user);
    if (isSigningIn) {
      if (user.password !== password) {
        return {
          headers,
          statusCode: 401,
          body: JSON.stringify({
            message: "Unauthorized - Invalid email/password combination",
          }),
        };
      }
      // Update isSignedIn status
      await ddbDocClient.send(
        new PutCommand({
          TableName: tableName,
          Item: {
            ...user,
            isSignedIn: true,
          },
        })
      );
      return {
        headers,
        statusCode: 200,
        body: JSON.stringify({
          message: "User signed in successfully",
          user: { ...user, isSignedIn: true, password: "" },
        }),
      };
    } else {
      // Update isSignedIn status
      await ddbDocClient.send(
        new PutCommand({
          TableName: tableName,
          Item: {
            ...user,
            isSignedIn: false,
          },
        })
      );
      return {
        headers,
        statusCode: 200,
        body: JSON.stringify({
          message: "User signed out successfully",
        }),
      };
    }
  } catch (error) {
    console.error("Error:", error);

    return {
      headers,
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
