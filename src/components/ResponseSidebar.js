import React from 'react';
import './ResponseSidebar.css';

// Function to format JSON with syntax highlighting
const formatJSON = (json) => {
    if (!json) return "";

    // Convert to string with proper indentation
    const jsonString = JSON.stringify(json, null, 2);

    // Add VS Code-like syntax highlighting
    return jsonString
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
            function (match) {
                let cls = 'json-number';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'json-key';
                        match = match.replace(/"/g, '').replace(/:$/, '');
                        return `<span class="${cls}">"${match}"</span>:`;
                    } else {
                        cls = 'json-string';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'json-boolean';
                } else if (/null/.test(match)) {
                    cls = 'json-null';
                }
                return `<span class="${cls}">${match}</span>`;
            });
};

const ResponseSidebar = ({ isOpen, responses, onClose }) => {
    return (
        <div className={`response-sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
                <h2>API Responses</h2>
                <button className="close-button" onClick={() => onClose(false)}>×</button>
            </div>

            <div className="sidebar-content">
                {Object.keys(responses).length === 0 ? (
                    <p className="no-responses">No API responses yet</p>
                ) : (
                    Object.entries(responses).map(([key, response], index) => (
                        <div key={index} className="response-item">
                            <h3>{key}</h3>
                            <pre
                                className="json-display"
                                dangerouslySetInnerHTML={{
                                    __html: formatJSON(response)
                                }}
                            />
                        </div>
                    ))
                )}
            </div>

            <div className="sidebar-footer">
                <button className="clear-button" onClick={() => onClose(true)}>
                    Clear All
                </button>
            </div>
        </div>
    );
};

export default ResponseSidebar; 