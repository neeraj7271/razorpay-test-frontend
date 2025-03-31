import React, { useState, useEffect } from 'react';
import {
    Layout,
    Menu,
    Button,
    Avatar,
    Dropdown,
    Card,
    Row,
    Col,
    Tag,
    Descriptions,
    Tabs,
    Statistic,
    Space,
    message,
    Badge,
    Alert,
    Spin,
    Empty,
    Input,
    Modal,
    Drawer,
} from 'antd';
import {
    UserOutlined,
    LogoutOutlined,
    AppstoreOutlined,
    HomeOutlined,
    CreditCardOutlined,
    HistoryOutlined,
    ShoppingOutlined,
    TagOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    MenuUnfoldOutlined,
    MenuFoldOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './User.css';
import SubscriptionModal from '../SubscriptionModal';
import ResponseSidebar from '../ResponseSidebar';
import api from '../utils/api';

const { Header, Content, Sider } = Layout;
const { TabPane } = Tabs;

const UserDashboard = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [activeKey, setActiveKey] = useState('dashboard');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState([]);
    const [loadingStates, setLoadingStates] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [activeSubscription, setActiveSubscription] = useState(null);
    const [subscriptionHistory, setSubscriptionHistory] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [sidebarOpen, setIsSidebarOpen] = useState(false);
    const [apiResponses, setApiResponses] = useState({});
    const [discountCode, setDiscountCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState(null);
    const [applyingDiscount, setApplyingDiscount] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        // Load user data from localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }

        // Load script for Razorpay
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);

        fetchUserData();
        fetchPlans();

        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
            if (window.innerWidth > 768) {
                setMobileDrawerVisible(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => {
            document.body.removeChild(script);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const fetchUserData = async () => {
        try {
            setLoading(true);

            console.log("Fetching user data");
            // Use the API utility to handle authentication automatically
            const userData = await api.get('/auth/profile');
            console.log("User profile response:", userData);

            // Update user state
            if (userData && userData.user) {
                setUser(userData.user);
                // Also update localStorage with the latest user data
                localStorage.setItem('user', JSON.stringify(userData.user));
            }

            // Update subscription state
            setActiveSubscription(userData.activeSubscription);
            setSubscriptionHistory(userData.subscriptionHistory || []);
            setTransactions(userData.transactions || []);

            // Store response for debugging
            setApiResponses(prev => ({
                ...prev,
                "User Profile": userData
            }));

        } catch (error) {
            console.error('Error fetching user data:', error);

            // Check if it's an auth error
            if (error.response && error.response.status === 401) {
                message.error('Your session has expired. Please log in again.');
                handleLogout();
            } else {
                message.error('Failed to load user data. Please refresh the page.');
            }

            // Store error for debugging
            setApiResponses(prev => ({
                ...prev,
                "User Profile Error": {
                    message: error.message,
                    response: error.response?.data
                }
            }));
        } finally {
            setLoading(false);
        }
    };

    const fetchPlans = async () => {
        setLoading(true);
        try {
            // Use the API utility to handle automatic fallbacks
            const plansData = await api.get('plans');
            console.log("API response for plans:", plansData);

            // Log the exact structure of the response
            console.log("Plans response structure:", {
                isArray: Array.isArray(plansData),
                type: typeof plansData,
                keys: plansData && typeof plansData === 'object' ? Object.keys(plansData) : [],
                hasPlans: plansData && plansData.plans ? true : false,
                hasData: plansData && plansData.data ? true : false
            });

            // Store API response for debugging
            setApiResponses(prev => ({
                ...prev,
                'Fetch Plans': plansData
            }));

            // Make sidebar visible when we get data
            setIsSidebarOpen(true);

            // Ensure plans is always an array
            let plansArray = [];

            if (Array.isArray(plansData)) {
                plansArray = plansData;
            }
            // Check if response.data has a plans or data property
            else if (plansData && typeof plansData === 'object') {
                if (plansData.plans) {
                    plansArray = Array.isArray(plansData.plans) ? plansData.plans : [];
                } else if (plansData.data) {
                    plansArray = Array.isArray(plansData.data) ? plansData.data : [];
                }
            }

            // Process each plan to ensure it has all needed IDs
            const processedPlans = plansArray.map(plan => {
                const planId = plan._id || plan.id || plan.planId || plan.razorpayPlanId;
                return {
                    ...plan,
                    _id: planId,
                    id: planId,
                    planId: planId,
                    price: plan.price || plan.amount || 0
                };
            });

            console.log("Processed plans:", processedPlans);
            setPlans(processedPlans);
        } catch (error) {
            console.error("Error fetching plans:", error);
            message.error('Failed to fetch plans. Please try again later.');
            setPlans([]); // Set to empty array on error

            // Store error for debugging
            setApiResponses(prev => ({
                ...prev,
                'Fetch Plans Error': {
                    message: error.message,
                    response: error.response?.data
                }
            }));
        } finally {
            setLoading(false);
        }
    };

    const handlePlanSelection = (plan) => {
        // Don't allow admin to subscribe
        if (isAdmin()) {
            message.info('As an admin, you cannot subscribe to plans.');
            return;
        }

        // Make sure plan is valid
        if (!plan) {
            message.error('Invalid plan selected. Please try again.');
            return;
        }

        console.log("Selected plan:", plan);

        // Handle plans with different property formats
        // Some plans might have _id, some might have id, some might have planId or razorpayPlanId
        const planId = plan._id || plan.id || plan.planId || plan.razorpayPlanId;
        if (!planId) {
            console.error("Plan ID missing:", plan);
            message.error('Plan ID is missing. Please try again with a different plan.');
            return;
        }

        // Create a normalized plan object to avoid property mismatches
        const normalizedPlan = {
            ...plan,
            _id: planId,
            id: planId,
            planId: planId
        };

        setSelectedPlan(normalizedPlan);
        setShowModal(true);
        setAppliedDiscount(null);
        setDiscountCode('');

        // Make API responses sidebar visible to help debug
        setIsSidebarOpen(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setSelectedPlan(null);
        setAppliedDiscount(null);
        setDiscountCode('');
    };

    const handleProceedToPayment = () => {
        if (selectedPlan) {
            handleSubscriptionPayment(selectedPlan);
            setShowModal(false);
        }
    };

    const handleSubscriptionPayment = async (plan) => {
        // Security check - don't allow admin to subscribe
        if (isAdmin()) {
            message.info('As an admin, you cannot subscribe to plans.');
            return;
        }

        // Validate plan data
        if (!plan || !plan.name) {
            message.error('Invalid plan data');
            return;
        }

        setLoadingStates((prev) => ({ ...prev, [plan.name]: true }));

        try {
            // Validate user data
            if (!user || !user.name || !user.email) {
                throw new Error('User profile information is incomplete');
            }

            const customerDetails = {
                name: user.name,
                email: user.email,
                contact: user.phone || '9999999999'
            };

            // Check if plan has a valid ID - accept various property names
            const planId = plan.planId || plan._id || plan.id || plan.razorpayPlanId;
            if (!planId) {
                throw new Error('Plan ID is missing');
            }

            console.log(`Creating subscription with planId: ${planId}`);

            const payload = {
                planId: planId,
                customerDetails: customerDetails,
                totalCount: 12, // Monthly payments for a year
                customerId: user.razorpayCustomerId || null
            };

            // Add discount if one is applied
            if (appliedDiscount) {
                payload.discountCode = appliedDiscount.code;
            }

            // Log the payload for debugging
            console.log("Subscription payload:", payload);

            // Store the payload in API responses for debugging
            setApiResponses(prev => ({
                ...prev,
                "Subscription Request Payload": payload
            }));

            // Make sure the sidebar is visible
            setIsSidebarOpen(true);

            // Use API utility to handle authentication and fallbacks
            try {



                const response = await api.post('create-subscription', payload);
                console.log("Subscription created successfully:", response);

                // Store the subscription response
                setApiResponses(prev => ({
                    ...prev,
                    [`Create Subscription (${plan.name})`]: response
                }));

                if (response.success && response.subscription) {
                    const subscription = response.subscription;

                    // Check if Razorpay is loaded
                    if (typeof window.Razorpay !== 'function') {
                        console.error("Razorpay is not loaded correctly", window.Razorpay);
                        throw new Error('Razorpay SDK failed to load. Please refresh the page and try again.');
                    }

                    // Open Razorpay payment for subscription
                    const options = {
                        key: 'rzp_test_dWLBx9Ob7rYIdJ', // Replace with your key
                        subscription_id: subscription.id,
                        name: 'Your Company',
                        description: `Subscription for ${plan.name} Plan`,
                        handler: function (paymentResponse) {
                            // Handle successful payment
                            message.success(`Subscription payment successful! Payment ID: ${paymentResponse.razorpay_payment_id}`);

                            // Store the payment response for debugging
                            setApiResponses(prev => ({
                                ...prev,
                                [`Payment Response (${plan.name})`]: paymentResponse
                            }));

                            // Refresh user data to get updated subscription
                            fetchUserData();
                        },
                        prefill: {
                            name: customerDetails.name,
                            email: customerDetails.email,
                            contact: customerDetails.contact
                        },
                        theme: {
                            color: '#1890ff'
                        },
                        modal: {
                            ondismiss: function () {
                                message.info('Payment cancelled');
                            }
                        }
                    };

                    try {
                        const paymentObject = new window.Razorpay(options);
                        paymentObject.open();
                    } catch (razorpayError) {
                        console.error('Error opening Razorpay:', razorpayError);
                        message.error('Error opening payment form. Please try again.');
                    }
                } else {
                    message.error(response.message || "Failed to create subscription. Please try again.");
                }
            } catch (apiError) {
                console.error("API Error creating subscription:", apiError);

                // Fallback to direct Razorpay payment if API calls fail
                message.info("Using direct Razorpay integration as fallback");

                const options = {
                    key: 'rzp_test_dWLBx9Ob7rYIdJ',
                    name: 'Your Company',
                    description: `Subscription for ${plan.name} Plan`,
                    amount: parseFloat(plan.price) * 100, // Convert to paise
                    currency: 'INR',
                    handler: function (response) {
                        message.success(`Payment successful! Payment ID: ${response.razorpay_payment_id}`);
                        fetchUserData(); // Refresh user data
                    },
                    prefill: {
                        name: customerDetails.name,
                        email: customerDetails.email,
                        contact: customerDetails.contact
                    },
                    theme: {
                        color: '#1890ff'
                    }
                };

                const rzp = new window.Razorpay(options);
                rzp.open();
            }
        } catch (error) {
            console.error('Error creating subscription:', error);
            message.error(error.message || "Error creating subscription. Please try again.");

            // Store the error response for debugging
            setApiResponses(prev => ({
                ...prev,
                [`Subscription Error (${plan.name})`]: {
                    error: error.message,
                    response: error.response?.data
                }
            }));
        } finally {
            setLoadingStates((prev) => ({ ...prev, [plan.name]: false }));
        }
    };

    const handleClearResponses = (clearAll = false) => {
        if (clearAll) {
            setApiResponses({});
        } else {
            setIsSidebarOpen(false);
        }
    };

    const applyDiscountCode = async () => {
        if (!discountCode || !selectedPlan) return;

        try {
            setApplyingDiscount(true);

            const response = await api.post('validate-discount', {
                code: discountCode,
                planId: selectedPlan._id
            });

            // Store the response for debugging
            setApiResponses(prev => ({
                ...prev,
                "Discount Validation": response
            }));

            if (response.valid) {
                setAppliedDiscount(response.discount);
                message.success(`Discount applied: ${response.discount.code}`);
            } else {
                message.error(response.message || 'Invalid discount code');
                setAppliedDiscount(null);
            }
        } catch (error) {
            console.error('Error applying discount:', error);
            message.error('Failed to apply discount code');

            // Store error for debugging
            setApiResponses(prev => ({
                ...prev,
                "Discount Error": {
                    message: error.message,
                    response: error.response?.data
                }
            }));
        } finally {
            setApplyingDiscount(false);
        }
    };

    const calculateDiscountedPrice = (price) => {
        // Make sure price is a number
        const numericPrice = parseFloat(price) || 0;

        if (!appliedDiscount) return numericPrice;

        let discountedPrice;
        if (appliedDiscount.type === 'percentage') {
            discountedPrice = numericPrice - (numericPrice * (parseFloat(appliedDiscount.value) / 100));
        } else {
            discountedPrice = Math.max(0, numericPrice - parseFloat(appliedDiscount.value));
        }

        return discountedPrice;
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const sidebarContent = (
        <>
            <div className="logo">
                {collapsed && !isMobile ? 'R' : 'Razorpay'}
            </div>
            <Menu
                theme="dark"
                mode="inline"
                selectedKeys={[activeKey]}
                items={[
                    {
                        key: 'dashboard',
                        icon: <HomeOutlined />,
                        label: 'Dashboard',
                    },
                    {
                        key: 'plans',
                        icon: <ShoppingOutlined />,
                        label: 'Pricing',
                    },
                    {
                        key: 'subscriptions',
                        icon: <CreditCardOutlined />,
                        label: 'Subscriptions',
                    },
                    {
                        key: 'transactions',
                        icon: <HistoryOutlined />,
                        label: 'Transactions',
                    },
                ]}
                onClick={({ key }) => {
                    setActiveKey(key);
                    if (isMobile) {
                        setMobileDrawerVisible(false);
                    }
                }}
            />
        </>
    );

    const renderDashboardContent = () => {
        if (loading) {
            return <div className="loading-container"><Spin size="large" /></div>;
        }

        return (
            <div className="dashboard-content">
                <h2>Welcome, {user?.name}!</h2>

                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} lg={8}>
                        <Card className="stat-card">
                            <Statistic
                                title="Current Plan"
                                value={activeSubscription ? activeSubscription.plan.name : "No Active Plan"}
                                prefix={<AppstoreOutlined />}
                            />
                            {activeSubscription && (
                                <Tag color="green" style={{ marginTop: 8 }}>
                                    Active until {new Date(activeSubscription.endDate).toLocaleDateString()}
                                </Tag>
                            )}
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={8}>
                        <Card className="stat-card">
                            <Statistic
                                title="Total Spent"
                                value={user?.totalSpent || 0}
                                prefix="₹"
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={8}>
                        <Card className="stat-card">
                            <Statistic
                                title="Subscription Status"
                                value={activeSubscription ? "Active" : "Inactive"}
                                valueStyle={{ color: activeSubscription ? '#52c41a' : '#ff4d4f' }}
                            />
                        </Card>
                    </Col>
                </Row>

                {!activeSubscription && (
                    <Alert
                        message="No Active Subscription"
                        description="You don't have an active subscription. Check out our plans below to get started!"
                        type="info"
                        showIcon
                        style={{ margin: '24px 0' }}
                    />
                )}

                {activeSubscription && (
                    <Card title="Current Subscription Details" style={{ marginTop: 24 }}>
                        <Descriptions bordered column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}>
                            <Descriptions.Item label="Plan">{activeSubscription.plan.name}</Descriptions.Item>
                            <Descriptions.Item label="Price">₹{activeSubscription.plan.price}/month</Descriptions.Item>
                            <Descriptions.Item label="Start Date">{new Date(activeSubscription.startDate).toLocaleDateString()}</Descriptions.Item>
                            <Descriptions.Item label="End Date">{new Date(activeSubscription.endDate).toLocaleDateString()}</Descriptions.Item>
                            <Descriptions.Item label="Status">
                                <Tag color="green">Active</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Payment Status">
                                <Tag color={activeSubscription.paymentStatus === 'paid' ? 'green' : 'gold'}>
                                    {activeSubscription.paymentStatus.toUpperCase()}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Features" span={3}>
                                {activeSubscription.plan.features && activeSubscription.plan.features.map((feature, index) => (
                                    <Tag color="blue" key={index} style={{ margin: '0 8px 8px 0' }}>
                                        {feature}
                                    </Tag>
                                ))}
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>
                )}
            </div>
        );
    };

    const isAdmin = () => {
        // Check if user has admin role
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.role === 'admin';
    };

    const renderPlansContent = () => {
        if (loading) {
            return <div className="loading-container"><Spin size="large" /></div>;
        }

        // If admin is viewing this page, show a message
        if (isAdmin()) {
            return (
                <div className="plans-content">
                    <h2>Plans Overview</h2>
                    <Alert
                        message="Admin View"
                        description="You are viewing plans in admin mode. For plan management, please use the dedicated admin dashboard."
                        type="info"
                        showIcon
                        style={{ marginBottom: 24 }}
                    />
                    <div className="plans-container">
                        {!Array.isArray(plans) ? (
                            <Empty
                                description="Unable to load plans. Please try again later."
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                        ) : plans.length === 0 ? (
                            <Empty
                                description="No plans available at the moment."
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                        ) : (
                            plans.map((plan) => (
                                <Card
                                    key={plan._id || plan.id || Math.random().toString()}
                                    className="plan-card"
                                    title={
                                        <div className="plan-header">
                                            <h3>{plan.name}</h3>
                                            <div className="plan-price">₹{plan.price}/mo</div>
                                        </div>
                                    }
                                >
                                    <div className="plan-description">{plan.description}</div>
                                    <div className="plan-features">
                                        {Array.isArray(plan.features) && plan.features.map((feature, index) => (
                                            <div key={index} className="plan-feature">
                                                <CheckCircleOutlined className="feature-icon" /> {feature}
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            );
        }

        // Regular user view with subscribe buttons
        return (
            <div className="plans-content">
                <h2>Choose Your Plan</h2>
                <div className="plans-container">
                    {!Array.isArray(plans) ? (
                        <Empty
                            description="Unable to load plans. Please try again later."
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    ) : plans.length === 0 ? (
                        <Empty
                            description="No plans available at the moment."
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    ) : (
                        plans.map((plan) => (
                            <Card
                                key={plan._id || plan.id || Math.random().toString()}
                                className="plan-card"
                                title={
                                    <div className="plan-header">
                                        <h3>{plan.name}</h3>
                                        <div className="plan-price">₹{plan.price}/mo</div>
                                    </div>
                                }
                                actions={[
                                    <Button
                                        type="primary"
                                        loading={loadingStates[plan.name]}
                                        onClick={() => handlePlanSelection(plan)}
                                        disabled={activeSubscription && activeSubscription.plan._id === plan._id}
                                    >
                                        {activeSubscription && activeSubscription.plan._id === plan._id
                                            ? 'Current Plan'
                                            : 'Subscribe Now'}
                                    </Button>
                                ]}
                            >
                                <div className="plan-description">{plan.description}</div>
                                <div className="plan-features">
                                    {Array.isArray(plan.features) && plan.features.map((feature, index) => (
                                        <div key={index} className="plan-feature">
                                            <CheckCircleOutlined className="feature-icon" /> {feature}
                                        </div>
                                    ))}
                                </div>
                                {activeSubscription && activeSubscription.plan._id === plan._id && (
                                    <div className="current-plan-badge">
                                        <Badge.Ribbon text="Current Plan" color="green" />
                                    </div>
                                )}
                            </Card>
                        ))
                    )}
                </div>
            </div>
        );
    };

    const renderSubscriptionsContent = () => {
        if (loading) {
            return <div className="loading-container"><Spin size="large" /></div>;
        }

        return (
            <div className="subscriptions-content">
                <h2>Your Subscriptions</h2>

                {subscriptionHistory.length === 0 ? (
                    <Empty
                        description="You haven't subscribed to any plans yet"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                ) : (
                    <div className="subscription-history">
                        {subscriptionHistory.map((subscription, index) => (
                            <Card
                                key={index}
                                className="subscription-card"
                                title={
                                    <div className="subscription-header">
                                        <Space>
                                            <span>{subscription.plan.name}</span>
                                            {new Date() >= new Date(subscription.endDate) ? (
                                                <Tag color="red">Expired</Tag>
                                            ) : (
                                                <Tag color="green">Active</Tag>
                                            )}
                                        </Space>
                                    </div>
                                }
                            >
                                <Descriptions column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}>
                                    <Descriptions.Item label="Price">₹{subscription.plan.price}/month</Descriptions.Item>
                                    <Descriptions.Item label="Start Date">{new Date(subscription.startDate).toLocaleDateString()}</Descriptions.Item>
                                    <Descriptions.Item label="End Date">{new Date(subscription.endDate).toLocaleDateString()}</Descriptions.Item>
                                    <Descriptions.Item label="Payment Status">
                                        <Tag color={subscription.paymentStatus === 'paid' ? 'green' : 'gold'}>
                                            {subscription.paymentStatus.toUpperCase()}
                                        </Tag>
                                    </Descriptions.Item>
                                </Descriptions>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderTransactionsContent = () => {
        if (loading) {
            return <div className="loading-container"><Spin size="large" /></div>;
        }

        return (
            <div className="transactions-content">
                <h2>Transaction History</h2>

                {transactions.length === 0 ? (
                    <Empty
                        description="No transactions found"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                ) : (
                    <div className="transaction-list">
                        {transactions.map((transaction, index) => (
                            <Card
                                key={index}
                                className="transaction-card"
                                style={{ marginBottom: 16 }}
                            >
                                <div className="transaction-header">
                                    <Space>
                                        <span className="transaction-date">
                                            {new Date(transaction.date).toLocaleDateString()}
                                        </span>
                                        <Tag color={
                                            transaction.status === 'success' ? 'green' :
                                                transaction.status === 'pending' ? 'gold' : 'red'
                                        }>
                                            {transaction.status.toUpperCase()}
                                        </Tag>
                                    </Space>
                                </div>
                                <div className="transaction-details">
                                    <p><strong>{transaction.description}</strong></p>
                                    <p>Amount: ₹{transaction.amount}</p>
                                    {transaction.paymentId && <p>Payment ID: {transaction.paymentId}</p>}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderContent = () => {
        switch (activeKey) {
            case 'dashboard':
                return renderDashboardContent();
            case 'plans':
                return renderPlansContent();
            case 'subscriptions':
                return renderSubscriptionsContent();
            case 'transactions':
                return renderTransactionsContent();
            default:
                return renderDashboardContent();
        }
    };

    // Make sidebar visibility globally available for debugging
    // This allows other components to show the sidebar
    useEffect(() => {
        window.setApiResponses = (newResponses) => {
            setApiResponses(newResponses);
            setIsSidebarOpen(true);
        };

        return () => {
            delete window.setApiResponses;
        };
    }, []);

    return (
        <Layout className="user-layout">
            {isMobile ? (
                <Drawer
                    placement="left"
                    closable={false}
                    onClose={() => setMobileDrawerVisible(false)}
                    open={mobileDrawerVisible}
                    contentWrapperStyle={{ width: '250px' }}
                    bodyStyle={{ padding: 0, backgroundColor: '#001529' }}
                >
                    {sidebarContent}
                </Drawer>
            ) : (
                <Sider
                    trigger={null}
                    collapsible
                    collapsed={collapsed}
                    width={250}
                    className="user-sider"
                >
                    {sidebarContent}
                </Sider>
            )}
            <Layout className="user-layout-content">
                <Header className="site-header">
                    <Button
                        type="text"
                        icon={isMobile ? <MenuUnfoldOutlined /> : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
                        onClick={() => isMobile ? setMobileDrawerVisible(true) : setCollapsed(!collapsed)}
                        className="trigger-button"
                    />
                    <div className="header-right">
                        <Dropdown
                            menu={{
                                items: [
                                    {
                                        key: 'profile',
                                        label: 'Profile',
                                        icon: <UserOutlined />,
                                    },
                                    {
                                        key: 'logout',
                                        label: 'Logout',
                                        icon: <LogoutOutlined />,
                                        onClick: handleLogout,
                                    },
                                ],
                            }}
                            className="user-dropdown"
                        >
                            <Space>
                                <Avatar icon={<UserOutlined />} />
                                <span className="username">{user?.name}</span>
                            </Space>
                        </Dropdown>
                    </div>
                </Header>
                <Content className="site-content">
                    {loading ? (
                        <div className="loading-container">
                            <Spin size="large" />
                        </div>
                    ) : (
                        renderContent()
                    )}
                </Content>
            </Layout>

            {/* Subscription Modal */}
            {showModal && selectedPlan && (
                <SubscriptionModal
                    visible={showModal}
                    plan={selectedPlan}
                    onClose={handleModalClose}
                    onProceed={handleProceedToPayment}
                    customerDetails={{
                        name: user?.name,
                        email: user?.email,
                        phone: user?.phone || 'Not provided'
                    }}
                    appliedDiscount={appliedDiscount}
                    discountCode={discountCode}
                    onDiscountCodeChange={setDiscountCode}
                    onApplyDiscount={applyDiscountCode}
                    applyingDiscount={applyingDiscount}
                    calculatedPrice={calculateDiscountedPrice(selectedPlan.price)}
                />
            )}

            {/* Response Sidebar for debugging */}
            <ResponseSidebar
                isOpen={sidebarOpen}
                responses={apiResponses}
                onClose={handleClearResponses}
            />

            <Button
                className="toggle-sidebar-button"
                onClick={() => setIsSidebarOpen(!sidebarOpen)}
            >
                {sidebarOpen ? 'Hide' : 'Show'} API Responses
            </Button>
        </Layout>
    );
};

export default UserDashboard; 