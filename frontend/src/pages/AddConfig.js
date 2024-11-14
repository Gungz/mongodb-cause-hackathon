import React, { useState, useRef, useEffect } from 'react';
import styles from './AddConfig.module.css';
import { Stepper } from 'primereact/stepper';
import { StepperPanel } from 'primereact/stepperpanel';
import { Button } from 'primereact/button';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import PDF from '../component/Pdf'; 
import { FileUpload } from 'primereact/fileupload';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputText } from 'primereact/inputtext';
import PrettyPrintJson from '../component/PrettyPrintJson';
import { BlockUI } from 'primereact/blockui';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Toast } from 'primereact/toast';
import { useParams } from 'react-router';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AddConfig() {
    const stepperRef = useRef(null);
    const toast = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    
    const [blocked, setBlocked] = useState(false);
    const [showSpinner, setShowSpinner] = useState(false);

    const [fileUrl, setFileUrl] = useState("");
    const [objectKey, setObjectKey] = useState("");
    const fileUploadRef = useRef(null);
    const [prompt, setPrompt] = useState("");
    const handlePromptChange = (e) => {
        setPrompt(e.target.value);
    };
    const [promptResult, setPromptResult] = useState({});
    const [hostname, setHostname] = useState("");
    const handleHostnameChange = (e) => {
        setHostname(e.target.value);
    };
    const [port, setPort] = useState("");
    const handlePortChange = (e) => {
        setPort(e.target.value);
    };
    const [user, setUser] = useState("");
    const handleUserChange = (e) => {
        setUser(e.target.value);
    };
    const [pass, setPass] = useState("");
    const handlePassChange = (e) => {
        setPass(e.target.value);
    };
    const [database, setDatabase] = useState("");
    const handleDatabaseChange = (e) => {
        setDatabase(e.target.value);
    };
    const [collection, setCollection] = useState("");
    const handleCollectionChange = (e) => {
        setCollection(e.target.value);
    };
    const[documentType, setDocumentType] = useState("");
    const handleDocumentTypeChange = (e) => {
        setDocumentType(e.target.value);
    }
    const[documentIssuedBy, setDocumentIssuedBy] = useState("");
    const handleDocumentIssuedByChange = (e) => {
        setDocumentIssuedBy(e.target.value);
    }

    const uploadHandler = ({files}) => {
        const [file] = files;
        const fileName = file.name;
        const fileReader = new FileReader();
        fileReader.onload = (e) => {
            uploadFile(e.target.result, fileName);
        };
        fileReader.readAsDataURL(file);
    };
    const uploadFile = async (file, fileName) => {
        setShowSpinner(true);
        setBlocked(true);
        const byte64 = file.split(',')[1];
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}${process.env.REACT_APP_BACKEND_URL_UPLOAD_SAMPLE}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ document: byte64, filename: fileName })
        });
        const data = await response.json();
        setFileUrl(data.s3_url);
        setObjectKey(data.s3_key);
        fileUploadRef.current.clear();
        setShowSpinner(false);
        setBlocked(false);
    };
    const testPrompt = async () => {
        if(!prompt || !objectKey) {
            alert("Sample document must be uploaded and prompt must not be empty");
        }
        else {
            setShowSpinner(true);
            setBlocked(true);
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}${process.env.REACT_APP_BACKEND_URL_TEST_PROMPT}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt: prompt, object_key: objectKey })
            });
            const data = await response.json();
            setPromptResult(data.result);
            setShowSpinner(false);
            setBlocked(false);
        }
    }
    const checkCollectionHandler = async () => {
        setShowSpinner(true);
        setBlocked(true);
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}${process.env.REACT_APP_BACKEND_URL_CHECK_COLLECTION}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ host: hostname, port, database, username: user, password: pass, col_name: collection  })
        });
        const data = await response.json();
        //setCheckCollectionResult(data.message);
        let severity = "success";
        if (data.error_code) {
            if (data.error_code == "400") {
                severity = "info";
            } else if (data.error_code == "404") {
                severity = "error";
            }
        } 
        toast.current.show({ severity: severity, detail: data.message, life: 6000 })
        setShowSpinner(false);
        setBlocked(false);
    }
    const saveConfigHandler = async () => {
        setShowSpinner(true);
        setBlocked(true);
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}${process.env.REACT_APP_BACKEND_URL_SAVE_CONFIG}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ s3_key: objectKey, prompt: prompt, host: hostname, port, database, username: user, password: pass, col_name: collection, document_type: documentType, document_issued_by: documentIssuedBy })
        });
        const data = await response.json();
        if(data.status == "success") {
            toast.current.show({ severity: "success", detail: "Configuration has been successfully saved.", life: 6000 })
        } else {
            toast.current.show({ severity: "error", detail: data.error_message, life: 6000 })
        }
        setTimeout(()=> {
            if(location.pathname.includes("doc-config2")) {           
                navigate(`/doc-config/${data.configuration._id.$oid}`);
            } else {
                navigate(`/doc-config2/${data.configuration._id.$oid}`);
            }
        }, 3000);
        setShowSpinner(false);
        setBlocked(false);
    }

    const { id } = useParams()
    useEffect(() => {
        const fetchData = async () => {
            setShowSpinner(true);
            setBlocked(true);
            const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}${process.env.REACT_APP_BACKEND_URL_CONFIG}/${id}`)
            const data = await response.json()
            const config = data.result;
            if(config) {
                setFileUrl(data.s3_url);
                setObjectKey(data.s3_key);
                setPrompt(config.prompt);
                setHostname(config.db_host);
                setPort(config.db_port);
                setUser(config.db_username);
                setPass(config.db_password);
                setDatabase(config.db_name);
                setCollection(config.col_name);
                setDocumentType(config.doc_type);
                setDocumentIssuedBy(config.doc_issued_by);
            }
            setShowSpinner(false);
            setBlocked(false);    
        }
        if (id) {
            fetchData();
        } 
    }, [id])

    return (
        <div className="card flex justify-content-center">
            <BlockUI blocked={blocked} fullScreen />
            <div style={{position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%, -50%)'}}>
                { showSpinner && 
                    <ProgressSpinner strokeWidth="8" style={{width: '3rem', height: '3rem'}} animationDuration=".5s" />
                }
            </div>
            <Toast ref={toast} />

            <Stepper ref={stepperRef} style={{ flexBasis: '50rem' }} orientation="vertical">
                <StepperPanel header="Upload Document and Test Prompt">
                    <div className="flex flex-column h-12rem">
                        <Splitter style={{ height: 'auto' }}>
                            <SplitterPanel className="flex align-items-center justify-content-center" size={70}>
                                <Splitter layout="vertical">
                                    <SplitterPanel className="flex" size={5}>
                                        <FileUpload ref={fileUploadRef} name="file[]" style={{ display: 'inline'}} customUpload={true} uploadHandler={uploadHandler} multiple={false} accept="application/pdf,image/png,image/jpg,image/jpeg" maxFileSize={25000000} auto chooseLabel="Upload File *" emptyTemplate={<span className={styles.smallText}>You need to and drop files to here to upload or use button. Only accept pdf and image files (png, jpg, jpeg) with max. size of 25 MB.</span>} />
                                    </SplitterPanel>
                                    <SplitterPanel className="flex" size={90}>
                                        <InputTextarea id="prompt" value={prompt} onChange={handlePromptChange} style={{ width: '100%' }} autoResize placeholder="[Mandatory] Enter prompt to extract data from the uploaded document, ensure the output is in JSON format" />
                                    </SplitterPanel>
                                    <SplitterPanel className="flex" size={5}>
                                        <Button label="Test Prompt" icon="pi" iconPos="right" onClick={testPrompt} />          
                                    </SplitterPanel>
                                </Splitter>
                            </SplitterPanel>
                            <SplitterPanel className="flex align-items-center justify-content-center" size={30}><PDF url={fileUrl} object_key={objectKey} /></SplitterPanel>
                        </Splitter>
                        <PrettyPrintJson data={promptResult} />
                    </div>
                    <div className="flex py-4">
                        <br />
                        <Button label="Next" severity="success" icon="pi pi-arrow-right" iconPos="right" onClick={() => stepperRef.current.nextCallback()} />
                    </div>
                </StepperPanel>
                <StepperPanel header="Enter MongoDB Connection Details">
                    <div className="flex flex-column h-12rem">
                        <Splitter layout="vertical">
                            <SplitterPanel>
                                <Splitter>
                                    <SplitterPanel className="flex" size={30}><label htmlFor="hostname">Mongo DB Host *</label></SplitterPanel>
                                    <SplitterPanel className="flex" size={70}><InputText value={hostname} onChange={handleHostnameChange} style={{ width: '80%' }} id="hostname" placeholder="[Mandatory] hostname e.g. MongoDB Atlas host name" /></SplitterPanel>
                                </Splitter>
                            </SplitterPanel>
                            <SplitterPanel>
                                <Splitter>
                                    <SplitterPanel className="flex" size={30}><label htmlFor="port">Mongo DB Port</label></SplitterPanel>
                                    <SplitterPanel className="flex" size={70}><InputText value={port} onChange={handlePortChange} style={{ width: '80%' }} id="port" keyfilter="int" placeholder="[Optional] port e.g. 27001" /></SplitterPanel>
                                </Splitter>
                            </SplitterPanel>
                            <SplitterPanel>
                                <Splitter>
                                    <SplitterPanel className="flex" size={30}><label htmlFor="username">Mongo DB User *</label></SplitterPanel>
                                    <SplitterPanel className="flex" size={70}><InputText value={user} onChange={handleUserChange} style={{ width: '80%' }} id="username" placeholder="[Mandatory] username in MongoDB" /></SplitterPanel>
                                </Splitter>
                            </SplitterPanel>
                            <SplitterPanel>
                                <Splitter>
                                    <SplitterPanel className="flex" size={30}><label htmlFor="password">Mongo DB Password *</label></SplitterPanel>
                                    <SplitterPanel className="flex" size={70}><InputText value={pass} onChange={handlePassChange} style={{ width: '80%' }} id="password" placeholder="[Mandatory] password in MongoDB" /></SplitterPanel>
                                </Splitter>
                            </SplitterPanel>
                            <SplitterPanel>
                                <Splitter>
                                    <SplitterPanel className="flex" size={30}><label htmlFor="database">Mongo DB Database *</label></SplitterPanel>
                                    <SplitterPanel className="flex" size={70}><InputText value={database} onChange={handleDatabaseChange} style={{ width: '80%' }} id="database" placeholder="[Mandatory] database name to host collection" /></SplitterPanel>
                                </Splitter>
                            </SplitterPanel>
                            <SplitterPanel>
                                <Splitter>
                                    <SplitterPanel className="flex" size={30}><label htmlFor="collection">Mongo DB Collection *</label></SplitterPanel>
                                    <SplitterPanel className="flex" size={70}><InputText value={collection} onChange={handleCollectionChange} style={{ width: '80%' }} id="collection" placeholder="[Mandatory] collection name" /></SplitterPanel>
                                </Splitter>
                            </SplitterPanel>
                        </Splitter>
                    </div>
                    <div className="flex py-4 gap-2">
                        <Button label="Check Collection" onClick={checkCollectionHandler} /> &nbsp; <span className={styles.smallText}>Don't forget to whitelist the IP address of this app to the MongoDB to enable the checking, otherwise create the collection manually</span>
                    </div>
                    <div className="flex py-4 gap-2">
                        <br/>
                        <Button label="Back" severity="secondary" icon="pi pi-arrow-left" onClick={() => stepperRef.current.prevCallback()} /> &nbsp; 
                        <Button label="Next" severity="success"icon="pi pi-arrow-right" iconPos="right" onClick={() => stepperRef.current.nextCallback()} />
                    </div>
                </StepperPanel>
                <StepperPanel header="Information about Document">
                    <div className="flex flex-column h-12rem">
                        <Splitter layout="vertical">
                            <SplitterPanel>
                                <Splitter>
                                    <SplitterPanel className="flex" size={30}><label htmlFor="doctype">Document Type *</label></SplitterPanel>
                                    <SplitterPanel className="flex" size={70}><InputText style={{ width: '80%' }} value={documentType} onChange={handleDocumentTypeChange} id="doctype" keyfilter="alphanum" placeholder="[Mandatory] Document type, e.g. Invoice" /></SplitterPanel>
                                </Splitter>
                            </SplitterPanel>
                            <SplitterPanel>
                                <Splitter>
                                    <SplitterPanel className="flex" size={30}><label htmlFor="port">Document Issued by</label></SplitterPanel>
                                    <SplitterPanel className="flex" size={70}><InputText style={{ width: '80%' }} value={documentIssuedBy} onChange={handleDocumentIssuedByChange} id="port" keyfilter="alphanum" placeholder="[Optional] name of country or institution or company issuing the document" /></SplitterPanel>
                                </Splitter>
                            </SplitterPanel>
                        </Splitter>
                    </div>
                    <div className="flex py-4 gap-2">
                        <Button label="Save Configuration" onClick={saveConfigHandler} /> 
                    </div>
                    <div className="flex py-4 gap-2">
                        <br/>
                        <Button label="Back" severity="secondary" icon="pi pi-arrow-left" onClick={() => stepperRef.current.prevCallback()} /> &nbsp; 
                    </div>
                </StepperPanel>
            </Stepper>
        </div>
    );
}