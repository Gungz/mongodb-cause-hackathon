# Backend Service

The Backend Service is responsible for managing configurations to process documents and extract structured data using LLM. It provides REST APIs for administrative tasks such as:

1. Testing extraction prompts on sample documents.
2. Checking existence of MongoDB host, database, and collection.
3. Storing and retrieving document type configurations in a MongoDB database.

## Prerequisite
This service is built using Python 3.9.x and requires the following dependencies:

- AWS SDK for Python (Boto3)
- pymongo
- Other dependencies listed in the `requirements.txt` file

To start in new development environment, recommended to install virtual environment using `python3 -m venv env` from `backend` directory and then activate it before running `pip install -r requirements.txt`.

Have an AWS IAM User programmatic access (using access key and secret) with IAM role containing `AdministrationAccess` policy (we will do analysis of least privilege later). 

Initialize your bash or shell with AWS credentials (see [here](https://docs.aws.amazon.com/cli/v1/userguide/cli-chap-configure.html) for more detail). 

## How To Run and Test
1. Either change in `app.py` or use environment variable such as exporting in CLI below variables (add `FLASK_` prefix if using env vars):
- CORS_ALLOWED_URL: Fill this with URL of deployed frontend
- UPLOAD_FOLDER: Fill this with folder name of S3 bucket you created
- BUCKET_NAME: Fill this with name of S3 bucket you created
- REGION_NAME: 'us-east-1'
- MONGODB_CONNECTION_STRING: 'mongodb+srv://<db_user>:<db_password>@<db_host>/?retryWrites=true&w=majority' (for `<db_user>` and `<db_password>` please don't change as it will be propagated from secrets manager during runtime, only replace `<db_host>` with host/clusters from your Atlas connection string)
- MONGODB_DATABASE: Fill this with MongoDB database
- MONGODB_COLLECTION: Fill this with MongoDB collection
- MONGODB_CREDENTIAL_SECRET: Fill this with secret name of Secrets Manager (in same AWS region as the region name used in CLI and in `REGION_NAME` parameter)
2. Open terminal or CLI in `backend` folder and run `python3 app.py`
3. Use a tool like Postman to interact with the service's REST APIs (although you can also use front end to directly test it):
    a. `upload_sample`

        URL: http://<host>:5000/upload_sample
        Method: Post
        Request body: {
            "document": "<url to s3 bucket of sample document>",
            "filename": "<name of file>"
        }

    b. `test_prompt`

        URL: http://<host>:5000/test_prompt
        Method: Post
        Request body: {
            "object_key": "<s3 object key of uploaded doc>",
            "prompt": "<prompt used to extract information from document>"
        }

    c. `check_collection`

        URL: http://<host>:5000/check_collection
        Method: Post
        Request body: {
            "col_name": "<collection name to store extracted data>",
            "host": "<Mongo DB host/cluster, recommended to use Atlas>",
            "port": "<MongoDB port>",
            "database": "<MongoDB database name to store extracted data>",
            "username": "<MongoDB database user>",
            "password": "<MongoDB database password>"
        }
    
    d. `save_config`

        URL: http://<host>:5000/check_collection
        Method: Post
        Request body: {
            "s3_key": "<s3 object key of uploaded doc>",
            "col_name": "<collection name to store extracted data>",
            "host": "<Mongo DB host/cluster, recommended to use Atlas>",
            "port": "<MongoDB port>",
            "database": "<MongoDB database name to store extracted data>",
            "username": "<MongoDB database user>",
            "password": "<MongoDB database password>",
            "prompt": "<prompt used to extract information from document>", 
            "document_type": "<type of document>", 
            "document_issued_by": "<originator of document>"
        }

    d.  `delete_config/<config_id>`

        URL: http://<host>:5000/delete_config/<config_id>
        Method: Delete

    e.  `configs`

        URL: http://<host>:5000/configs
        Method: Get
    
    f. `config/<config_id>`

        URL: http://<host>:5000/config/<config_id>
        Method: Get

## Deployment
You can deploy this as container (see `Dockerfile`) or directly on host machine.

## Design Decision
Our deliberate decision on designing this app is that MongoDB's host, database, and collection that will store extracted data from documents could be different from MongoDB that is used to store the configuration itself, hence for each configuration we are asking MongoDB credential again. 

If this solution would like to used as SaaS, then some efforts must be done to replace the MongoDB credentials currently stored as plain text on DB with more secure solution such as integration with AWS Secrets Manager.

## What's Next
1. Add authentication layer to the API.
2. Analyze and use least privileged AWS IAM.
3. Add more validation on the backend.
4. Make the LLM (model ID) that processes the document selectable and configurable by admin.
5. Add infrastructure as a code to deploy this as container on AWS.