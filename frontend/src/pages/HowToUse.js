import React, { useState } from 'react';
import { Panel } from 'primereact/panel';
import styles from './AddConfig.module.css';
import { Link } from 'react-router-dom';
import { InputTextarea } from 'primereact/inputtextarea';

export default function HowToUse() {
    const promptSample1 = 
        `Please extract Provinsi, NIK, Nama, Tempat/Tgl Lahir, Jenis Kelamin, Gol. Darah, Alamat. RT, RW, Kel/Desa, Kecamatan, Agama, Status Perkawinan, Pekerjaan, Kewarganegaraan from document in <document></document> tag.
Output the extraction result in JSON format as per output defined in <output></output> tag. Replace the value in JSON with extracted result, leave it with blank value if no result for specific key. No need to have the XML tag outputted just the JSON.
<document>
{document}
</document>
<output>
{
    "province": "Provinsi",
    "nik": "NIK",
    "name": "Nama",
    "place_dob": "Tempat/Tgl Lahir",
    "gender": "Jenis Kelamin",
    "blood_type": "Gol. Darah",
    "address": "Alamat",
    "rt": "RT",
    "rw": "RW",
    "kelurahan": "Kel/Desa",
    "kecamatan": "Kecamatan",
    "religion": "Agama",
    "marriage_status": "Status Perkawinan",
    "job": "Pekerjaan",
    "nationality": "Kewarganegaraan"
}
</output>`;

    const promptSample2 = 
        `This document in <document></document> tag is receipt of purchased items.
Extract list of items bought along with qty, unit price (only number), and total price  (only number) from <document></document> tag. Also extract total price of all items (only number) from the list.
Output the extraction result in JSON format as per output defined in <output></output> tag. Replace the value in JSON with extracted result. No need to have the XML tag outputted just the JSON.
<document>
{document}
</document>
<output>
{
    "list_items": [
        {
                "item_name": "extracted item name",
                "qty": "extracted quantity of purchased items",
                "unit_price": extracted unit price of purchased item (only number)
                "total_price": extracted total price of purchased items (only number)
        }
    ],
    "total_price": extracted total price of all purchased items (only number)
}
</output>`;

    return (
        <div className="card flex justify-content-center">
            <Panel header="Step 1: Upload Document and Play with Prompts" toggleable>
                <div className={styles.container}>
                    <ol>
                        <li>
                            <strong>Go to <Link to="/new-doc-config">Add Doc Configuration</Link> page.</strong>
                        </li>
                        <li>
                            <strong>Upload file that you'd like extract information from.</strong> <br/>
                            This file can be any document as long as the size and extension follows what is allowed. <br/ >

                            If you'd like to extract information from ID card, upload ID card. <br/>
                            
                            If you'd like to extract information from invoice, upload invoice. <br/>
                            
                            If you'd like to extract information from bank statement, upload bank statement. <br/>
                            
                            If you'd like to extract information from contract, upload contract. <br/>
                            
                            If you'd like to extract information from resume, upload resume. <br/>
                            
                            If you'd like to extract information from medical check up result, upload medical check up result. <br/>
                            
                            If you'd like to extract information from any other document, upload that document.
                        </li>
                        <li>
                            <strong>Fill the prompt to extract information from that document.</strong> <br />
                            In this case, you need to understand what prompt is in LLM and because this solution leverages Anthropic Claude 3.5 Haiku, please read this <a href="https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview">documentation</a> from Anthropic. <br />                            
                            Also see below <strong>Prompt Examples</strong> that we have given for your inspiration so that you can set it for your document. <br />

                            One thing to note is that this solution combines OCR (Amazon Textract) with LLM (Anthropic Claude 3.5 Haiku on Amazon Bedrock). <br />
                            This implies that the prompt we design must contain placeholder for the OCR result. In this case, we use <strong>&#123;document&#125;</strong> as the placeholder.
                        </li>
                        <li>
                            <strong>Click on Test Prompt button</strong> <br />
                            This will test the prompt against the document you have uploaded. <br />
                            The LLM output (in JSON) will be shown below the button.<br />
                            If the output is not in JSON format, you can try to fix it by adding changing the prompt.
                        </li>
                        <li>
                            <strong>Important: one prompt for same document type but in different format</strong> <br />
                            You can try to test different prompt for the same document type but in different format. <br />
                            For example, invoice document can have different format but essentially what you want to extract is same information such as list of items (each containing the item name, quantity, unit price, unit of measure, and total price for each item) and some additional fields like the vendor name, date, etc. <br />
                            In this case, you test same prompt with different documents that you have by changing the uploaded file and see the result. <br /> 
                            If it is good for variety of documents tested, you can use same prompt for a document type without filling the originator of the document (see also <strong>Step 3</strong> below).
                        </li>
                    </ol>
                </div>
            </Panel>
            <br/>
            <Panel header="Step 2: Define MongoDB Connection Details" toggleable>
                <div className={styles.container}>
                    <ol>
                        <li>
                            <strong>Click Next to enter MongoDB Connection Details</strong>
                        </li>
                        <li>
                            <strong>Fill the MongoDB Host, Port, User, Password, Database, Collection</strong> <br />
                            Follow the instruction on the page itself.
                        </li>
                        <li>
                            <strong>Click on Check Collection</strong> <br/>
                            This is intended just to check if MongoDB host already exist, database and collection do not need to exist for this solution to work but just to show if it is already there or not.
                        </li>
                    </ol>
                </div>
            </Panel>
            <br/>
            <Panel header="Step 3: Define Document Type (and optionally originator issuing the document)" toggleable>
                <div className={styles.container}>
                    <ol>
                        <li>
                            <strong>Click Next to enter Information about Document</strong>
                        </li>
                        <li>
                            <strong>Fill the Document Type and Document Issued by</strong> <br />
                            Follow the instruction on the page itself. <br />
                            Typically we recommend Document Issued by is filled if the prompt can not be generically made to cover different format of same document type (e.g. invoice). <br />
                            In this case, you need specific prompt to handle it and you need one additional identifier which is originator of the document.
                        </li>
                    </ol>
                </div>
            </Panel>
            <br />
            <Panel header="Step 4: Call the API (integration with any app or how you use it is up to you)" toggleable>
                <div className={styles.container}>
                    <ol>
                        <li>
                            <strong>Call the API</strong> <br />
                            See the video demo for more detail. <br />
                            You can use the API to extract information from any type of document and also for <strong>CAUSE</strong> that you support.
                        </li>
                    </ol>
                </div>
            </Panel>
            <br />
            <Panel header="Prompt Example 1: Indonesian ID Card" toggleable>
                <div className={styles.container}>
                    <InputTextarea style={{ width: '100%', height: '10rem' }} value={promptSample1} />
                </div>
            </Panel>
            <Panel header="Prompt Example 2: Receipt" toggleable>
                <div className={styles.container}>
                    <InputTextarea style={{ width: '100%', height: '10rem' }} value={promptSample2} />
                </div>
            </Panel>
            <br />
            <Panel header="Video Demo" toggleable>
                <p>
                    TBD
                </p>
            </Panel>
        </div>
    );
}