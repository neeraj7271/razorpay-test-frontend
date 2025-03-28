import React from 'react';
import './SubscriptionModal.css';

const SubscriptionModal = ({ plan, onClose, onProceed, customerDetails }) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Subscription Details</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    <div className="plan-summary">
                        <h3>Plan Details</h3>
                        <div className="summary-item">
                            <span>Plan Name:</span>
                            <span>{plan.name}</span>
                        </div>
                        <div className="summary-item">
                            <span>Price:</span>
                            <span>{plan.price}/month</span>
                        </div>
                        <div className="summary-item">
                            <span>Billing Cycle:</span>
                            <span>Monthly</span>
                        </div>
                    </div>

                    <div className="features-list">
                        <h3>Features Included</h3>
                        <ul>
                            {plan.features.map((feature, index) => (
                                <li key={index}>✓ {feature}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="customer-details">
                        <h3>Customer Information</h3>
                        <div className="summary-item">
                            <span>Name:</span>
                            <span>{customerDetails.name}</span>
                        </div>
                        <div className="summary-item">
                            <span>Email:</span>
                            <span>{customerDetails.email}</span>
                        </div>
                        <div className="summary-item">
                            <span>Contact:</span>
                            <span>{customerDetails.contact}</span>
                        </div>
                    </div>

                    <div className="total-section">
                        <h3>Total Amount</h3>
                        <div className="summary-item total">
                            <span>Monthly Payment:</span>
                            <span>{plan.price}</span>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="cancel-button" onClick={onClose}>Cancel</button>
                    <button className="proceed-button" onClick={onProceed}>
                        Proceed to Checkout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SubscriptionModal; 