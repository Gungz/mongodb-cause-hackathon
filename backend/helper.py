import re
import json
import logging

logger = logging.getLogger(__name__)

def invoke_bedrock_model_extraction(client, id, prompt, max_tokens=4096, temperature=0, top_p=0.9):
    response = ""
    try:
        response = client.converse(
            modelId=id,
            system=[
                {
                    "text": "You are an AI agent that's expert in extracting information from document and give the response in JSON format",
                },
            ],
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "text": prompt
                        }
                    ]
                }
            ],
            inferenceConfig={
                "temperature": temperature,
                "maxTokens": max_tokens,
                "topP": top_p
            }
        )
    except Exception as e:
        print(e)
        result = "Model invocation error"
        return result
    try:
        result = response['output']['message']['content'][0]['text']
        #metric = '\n--- Latency: ' + str(response['metrics']['latencyMs']) \
        #    + 'ms - Input tokens:' + str(response['usage']['inputTokens']) \
        #    + ' - Output tokens:' + str(response['usage']['outputTokens']) + ' ---\n'
        #print(metric)
        return result
    except Exception as e:
        print(e)
        result = "Output parsing error"
        return result


DDL_PROMPT = """
Create PostgreSQL DDL for table with name '{table_name}' from this JSON example in <example></example> tag.
<example>
{json}
</example>
If in doubt, always use varchar without length restriction for string type. If there's object or array value in JSON, use JSONB data type for the column.
Use your best judgment whether a column should be string, numeric, or date based on provided example.
Always add primary key doc_id serial auto_increment, create_date and update_date with current timestamp default value. 
Generate the DDL script only, without any preamble.
"""

def invoke_bedrock_model_ddl(client, id, prompt, max_tokens=4096, temperature=0, top_p=0.9):
    response = ""
    try:
        response = client.converse(
            modelId=id,
            system=[
                {
                    "text": "You are PostgreSQL Expert. You can generate DDL to execute against PostgreSQL DB from data example in JSON.",
                },
            ],
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "text": prompt
                        }
                    ]
                }
            ],
            inferenceConfig={
                "temperature": temperature,
                "maxTokens": max_tokens,
                "topP": top_p
            }
        )
    except Exception as e:
        print(e)
        result = "Model invocation error"
        return result
    try:
        result = response['output']['message']['content'][0]['text']
        return result
    except Exception as e:
        print(e)
        result = "Output parsing error"
        return result

def generate_embedding(client, id, text):
    native_request = {"inputText": text}
    # Convert the native request to JSON.
    request = json.dumps(native_request)
    
    try:
        # Invoke the model with the request.
        response = client.invoke_model(modelId=id, body=request)
        # Decode the model's native response body.
        model_response = json.loads(response["body"].read())
        # Extract and print the generated embedding and the input text token count.
        result = model_response["embedding"]
        return result
    except Exception as e:
        print(e)
        result = "Embedding invocation error"
        return result
    

def is_valid_arn(arn_str):
    # ARN format: arn:partition:service:region:account-id:resource-type/resource-id
    arn_pattern = r'^arn:(aws|aws-cn|aws-us-gov):(\w+):(\w+:\w+:\w+):(\d+):(.+)$'
    match = re.match(arn_pattern, arn_str)
    return bool(match)

def generate_presigned_url(bucket_name, object_key, s3_client, expiration=3600, operation='get_object'):
    """
    Generate a presigned URL for S3 operations.
    
    Args:
        bucket_name (str): Name of the S3 bucket
        object_key (str): Key of the object in S3
        expiration (int): Time in seconds for the URL to remain valid
        operation (str): S3 operation - 'get_object' for download, 'put_object' for upload
    
    Returns:
        str: Presigned URL
    """
    try:
        url = s3_client.generate_presigned_url(
            ClientMethod=operation,
            Params={
                'Bucket': bucket_name,
                'Key': object_key
            },
            ExpiresIn=expiration
        )
        logger.info(f"Generated presigned URL for {operation}: {url}")
        return url
    except Exception as e:
        logger.error(f"Failed to generate presigned URL: {str(e)}")
        raise