import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './Pdf.css';
import { Image } from 'primereact/image';

export default function PDF({ url, object_key }) {
    
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  const [numPages, setNumPages] = useState(null);

  /*To Prevent right click on screen*/
  document.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });
  
  /*When document gets loaded successfully*/
  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  return (
    <>
    <div className="main">
      { object_key ?
          object_key.endsWith('pdf') ? (
            <Document 
              file={url}
              onLoadSuccess={onDocumentLoadSuccess}
            >
              {Array.from(
                new Array(numPages),
                (el, index) => (
                  <Page
                      key={`page_${index + 1}`}
                      pageNumber={index + 1}
                  />
                ),
              )}
            </Document>  
          ) : (
            <Image preview style={ { width: '100%', height: 'auto' } } src={url} alt="image uploaded for doc extraction" />
          )
        : (
          <p>No Document Uploaded</p>
        )
      }
    </div>
    </>
  );
}