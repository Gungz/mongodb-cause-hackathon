# Document to MongoDB Solution

This project provides an automated solution for extracting and structuring data from various document types into a MongoDB using Langchain, Textract, and Amazon Bedrock. The demo architecture leverages Amazon ECS, Amazon Textract, Amazon Bedrock, MongoDB Atlas, and Amazon S3 to ensure scalable, reliable, and efficient storage and processing of document extraction.

## Components

| Name | Description |
|--|--|
| **[Front End](frontend/README.md)** | Interfaces for administrator to configure sample documents, tested prompts, document type, and MongoDB database and collection to host documents' data. |
| **[Back End](backend/README.md)** | API that is called by Front End to do things mentioned above from Front End. |
| **[API](api/README.md)** | API that will be called by another app or CLI to upload document, extract data based on configuration, and store the extracted data on specified MongoDB database and collection. |

## Usage
- **Integrator of Another App**: Call the API via the provided DNS to send document, extract, and store extracted data from document to MongoDB.
- **Admins**: Access the front end application via the admin DNS for data extraction configuration.

See `How to Use` of the deployed FrontEnd web app for more information.

## How to Run
See README each component for more information and to understand how to run. Recommendation for order of deployment:
1. Backend
2. API
3. Frontend

## Possible Future Development
1. Enable flagging in API to let users choose whether they would like to save extracted data immediately to DB or just would like to get the extracted data as API response without storing the data.
2. Add more option for database engine to save extracted data (DynamoDB, MySQL, PostgreSQL, etc.).
3. Add more option for LLM (give options for admin to choose which LLM to use for document data extraction).
4. Add demo app that uses the API and extracted data to show end to end integration.
5. Also see What's Next section of each component's README.