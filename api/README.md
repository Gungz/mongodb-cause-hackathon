# API Service

The API Service provides REST APIs for any end-user or integrator to submit documents for data extraction based on configured document types. It handles the following tasks:

1. Accepting base64-encoded document files, filenames, and optional "issued by" document originator.
2. Uploading documents to an S3 bucket and using Amazon Textract to extract text.
3. Fetching appropriate configurations from a MongoDB based on document type and issuer.
4. Invoking the Bedrock AI model to extract structured data from the document text using configured prompts.
5. Storing the extracted JSON data in the target database collection.

## Prerequisite
This service is built using Python 3.9.x and requires the following dependencies:

- AWS SDK for Python (Boto3)
- pymongo (MongoDB database adapter)
- Other dependencies listed in the `requirements.txt` file

To start in new development environment, recommended to install virtual environment using `python3 -m venv env` from `api` directory and then activate the environment using `source/env/bin/activate` before running `pip install -r requirements.txt`.

Have an AWS IAM User programmatic access (using access key and secret) with IAM role containing `AdministrationAccess` policy (we will do analysis of least privilege later). 

Initialize your bash or shell with AWS credentials (see [here](https://docs.aws.amazon.com/cli/v1/userguide/cli-chap-configure.html) for more detail). 

Prepare the following in your AWS account:

1. S3 bucket and folder to hold the document sent to this API
2. Request Amazon Bedrock model access at least for `anthropic.claude-3-5-haiku-20241022-v1:0` in region `us-east-1` and ensure you have limit available to invoke it
3. MongoDB Atlas, can be created from AWS marketplace
4. Secrets Manager to hold your MongoDB credentials (you can use any name but have it store your Atlas DB user in `mongodb_user` key and Atlas DB pass in `mongodb_pass` key).

## How To Run and Test
1. Either change in `app.py` or use environment variable such as exporting in CLI below variables (add `FLASK_` prefix if using env vars):
- UPLOAD_FOLDER: Fill this with folder name of S3 bucket you created
- BUCKET_NAME: Fill this with name of S3 bucket you created
- REGION_NAME: 'us-east-1'
- MONGODB_CONNECTION_STRING: 'mongodb+srv://<db_user>:<db_password>@<db_host>/?retryWrites=true&w=majority' (for `<db_user>` and `<db_password>` please don't change as it will be propagated from secrets manager during runtime, only replace `<db_host>` with host/clusters from your Atlas connection string)
- MONGODB_DATABASE: Fill this with MongoDB database
- MONGODB_COLLECTION: Fill this with MongoDB collection that will store configurations
- MONGODB_CREDENTIAL_SECRET: Fill this with secret name of Secrets Manager (in same AWS region as the region name used in CLI and in `REGION_NAME` parameter)

2. Open terminal or CLI in `api` folder and run `python3 app.py`
2. Use postman or any other tool that can call REST API with below request:

    a. `extract/<doc_type>`

        URL: http://<host>:6000/extract/<doc_type>
        Method: Post
        Request body: {
            "document": "<base64encoded data of the file>",
            "filename": "<name of file>",
            "issued_by": "<optional, the originator of the document, only send this if the configuration is using originator>"
        }

## Deployment
You can deploy this as container (see `Dockerfile`) or directly on host machine.

## What's Next
1. Add authentication layer to the API.
2. Analyze and use least privileged AWS IAM.
3. Use LLM (model ID) from configuration.
4. Add infrastructure as a code to deploy this as container on AWS.
