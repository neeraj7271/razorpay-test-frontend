import React from 'react';
import './ResponseSidebar.css';

const ResponseSidebar = ({ isOpen, responses, onClose }) => {
    return (
        <div className={`response-sidebar ${isOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
                <h2>API Responses</h2>
                <button className="close-button" onClick={onClose}>×</button>
            </div>

            <div className="sidebar-content">
                {Object.keys(responses).length === 0 ? (
                    <p className="no-responses">No API responses yet</p>
                ) : (
                    Object.entries(responses).map(([key, response], index) => (
                        <div key={index} className="response-item">
                            <h3>{key}</h3>
                            <pre className="json-display">{JSON.stringify(response, null, 2)}</pre>
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