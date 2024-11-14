import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useNavigate } from 'react-router-dom';
import { BlockUI } from 'primereact/blockui';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Toast } from 'primereact/toast';

export default function AllConfigs() {
    const [configs, setConfigs] = useState([]);
    const navigate = useNavigate();
    const [blocked, setBlocked] = useState(false);
    const [showSpinner, setShowSpinner] = useState(false);
    const toast = useRef(null);
    
    const fetchConfigs = async () => {
        setShowSpinner(true);
        setBlocked(true);
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}${process.env.REACT_APP_BACKEND_URL_ALL_CONFIGS}`);
        const data = await response.json();
        setConfigs(data.result);
        setShowSpinner(false);
        setBlocked(false);
    }
    
    useEffect(() => {
        fetchConfigs();   
    }, []);

    const handleRowClick = (e) => {
        const { _id } = e.data;
        navigate(`/doc-config/${_id.$oid}`);
    };

    const emptyTemplateIssuedBy = (config) => {
        if (config.doc_issued_by == "") {
            return "-";
        } else {
            return config.doc_issued_by;
        }
    };

    const emptyTemplatePort = (config) => {
        if (config.db_port == "") {
            return "-";
        } else {
            return config.db_port;
        }
    };

    const handleDelete = async (config) => {
        const { _id } = config;
        const id = _id.$oid;
        setShowSpinner(true);
        setBlocked(true);
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}${process.env.REACT_APP_BACKEND_URL_DELETE_CONFIG}/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        if(data.status == "success") {
            await fetchConfigs();
        } else {
            toast.current.show({ severity: "error", detail: data.error_message, life: 6000 })
        }
        setShowSpinner(false);
        setBlocked(false);
    }

    const deleteButtonTemplate = (config) => {
        return (
            <div>
                <button className="btn btn-danger" onClick={() => handleDelete(config)}>Delete</button>
            </div>
        );
    }; 

    return (
        <div className="card flex justify-content-center">
            <BlockUI blocked={blocked} fullScreen />
            <div style={{position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%, -50%)'}}>
                { showSpinner && 
                    <ProgressSpinner strokeWidth="8" style={{width: '3rem', height: '3rem'}} animationDuration=".5s" />
                }
            </div>
            <Toast ref={toast} />

            <DataTable value={configs} stripedRows selectionMode="single" onRowClick={handleRowClick}>
                <Column sortable field="doc_type" header="Document Type"></Column>
                <Column sortable field="doc_issued_by" body={emptyTemplateIssuedBy} header="Document Issued By"></Column>
                <Column sortable field="db_host" header="Hostname"></Column>
                <Column field="db_port" header="Port" body={emptyTemplatePort}></Column>
                <Column field="db_username" header="Username"></Column>
                <Column field="db_password" header="Password"></Column>
                <Column field="db_name" header="Database"></Column>
                <Column field="col_name" header="Collection"></Column>
                <Column header="Action" body={deleteButtonTemplate}></Column>
            </DataTable>
        </div>
    );
}

    