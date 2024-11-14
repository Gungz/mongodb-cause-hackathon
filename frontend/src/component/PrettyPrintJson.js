import React from 'react';

const PrettyPrintJson = React.memo(({data}) => (<div><pre>{
    JSON.stringify(data, null, 2) }</pre></div>));

export default PrettyPrintJson;