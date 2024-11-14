import re
import json

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
        return result
    except Exception as e:
        print(e)
        result = "Output parsing error"
        return result