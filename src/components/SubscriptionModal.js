import React from 'react';
import { Modal, Button, Descriptions, Tag, Divider, Space, Input, Form, Alert, Spin } from 'antd';
import { TagOutlined, CheckCircleOutlined } from '@ant-design/icons';
import './SubscriptionModal.css';

const SubscriptionModal = ({
    plan,
    onClose,
    onProceed,
    customerDetails,
    appliedDiscount = null,
    discountCode = '',
    onDiscountCodeChange,
    onApplyDiscount,
    applyingDiscount = false,
    calculatedPrice
}) => {
    // Ensure plan.price is converted to a number
    const originalPrice = parseFloat(plan.price?.toString().replace(/[₹,]/g, '') || 0);

    // Ensure calculatedPrice is a number
    const finalPrice = typeof calculatedPrice === 'number' ? calculatedPrice : originalPrice;

    const getSavingsAmount = () => {
        if (!appliedDiscount) return 0;
        return originalPrice - finalPrice;
    };

    const getSavingsPercent = () => {
        if (!appliedDiscount) return 0;
        return Math.round((getSavingsAmount() / originalPrice) * 100);
    };

    // Format currency with validation
    const formatCurrency = (value) => {
        if (typeof value !== 'number') {
            value = parseFloat(value) || 0;
        }
        return value.toFixed(2);
    };

    return (
        <div className="subscription-modal-container">
            <Modal
                title="Confirm Subscription"
                open={true}
                onCancel={onClose}
                width={700}
                footer={[
                    <Button key="back" onClick={onClose}>
                        Cancel
                    </Button>,
                    <Button key="submit" type="primary" onClick={onProceed}>
                        Proceed to Payment
                    </Button>,
                ]}
            >
                <div className="subscription-modal-content">
                    <h2 className="plan-title">{plan.name} Plan</h2>

                    <Descriptions bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
                        <Descriptions.Item label="Price">₹{originalPrice}/month</Descriptions.Item>
                        <Descriptions.Item label="Duration">{plan.duration || 1} months</Descriptions.Item>
                        <Descriptions.Item label="Description" span={2}>{plan.description}</Descriptions.Item>
                    </Descriptions>

                    <Divider>Plan Features</Divider>

                    <div className="plan-features">
                        {plan.features && plan.features.map((feature, index) => (
                            <div key={index} className="plan-feature">
                                <CheckCircleOutlined className="feature-icon" /> {feature}
                            </div>
                        ))}
                    </div>

                    <Divider>Customer Information</Divider>

                    <div className="customer-info">
                        <div className="customer-field">
                            <strong>Name:</strong> {customerDetails.name}
                        </div>
                        <div className="customer-field">
                            <strong>Email:</strong> {customerDetails.email}
                        </div>
                        <div className="customer-field">
                            <strong>Phone:</strong> {customerDetails.contact}
                        </div>
                    </div>

                    <Divider>Apply Discount</Divider>

                    <div className="discount-section">
                        <Space.Compact style={{ width: '100%' }}>
                            <Input
                                placeholder="Enter discount code"
                                value={discountCode}
                                onChange={e => onDiscountCodeChange && onDiscountCodeChange(e.target.value)}
                                prefix={<TagOutlined />}
                                disabled={Boolean(appliedDiscount)}
                            />
                            <Button
                                type="primary"
                                onClick={onApplyDiscount}
                                loading={applyingDiscount}
                                disabled={Boolean(appliedDiscount)}
                            >
                                Apply
                            </Button>
                        </Space.Compact>

                        {appliedDiscount && (
                            <Alert
                                message={`Discount Applied: ${appliedDiscount.code}`}
                                description={
                                    <span>
                                        You save: ₹{formatCurrency(getSavingsAmount())} ({getSavingsPercent()}% off)
                                    </span>
                                }
                                type="success"
                                showIcon
                                closable
                                style={{ marginTop: 16 }}
                            />
                        )}
                    </div>

                    <Divider>Payment Summary</Divider>

                    <div className="payment-summary">
                        <div className="summary-item">
                            <span>Base Price:</span>
                            <span>₹{formatCurrency(originalPrice)}</span>
                        </div>

                        {appliedDiscount && (
                            <div className="summary-item discount">
                                <span>Discount ({appliedDiscount.code}):</span>
                                <span>-₹{formatCurrency(getSavingsAmount())}</span>
                            </div>
                        )}

                        <div className="summary-item total">
                            <span>Total Amount:</span>
                            <span>₹{formatCurrency(finalPrice)}</span>
                        </div>
                    </div>

                    <Divider />

                    <div className="confirmation-note">
                        <p>
                            By clicking "Proceed to Payment", you agree to our terms and conditions, and authorize Razorpay to charge your account the amount listed above.
                        </p>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default SubscriptionModal; 