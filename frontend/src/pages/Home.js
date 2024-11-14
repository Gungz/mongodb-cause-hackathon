import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
    return (
        <div>
            <h1>Welcome, this page is under construction.</h1>
            <br />
            <p style={ {fontSize: '1.5rem'} }>In a nutshell, we are creating a callable API that you can configure to extract various types of document with help of OCR and LLM.</p>
            <br />
            <p style={ {fontSize: '1.5rem'} }>You can visit <Link to="/how-to-use">How to Use</Link> to know how to use the app.</p>
        </div>
    );
}