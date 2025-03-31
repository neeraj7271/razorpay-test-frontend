import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    Table,
    Input,
    Tag,
    Space,
    Modal,
    message,
    Button,
    Tooltip,
    Badge,
    Card,
    Tabs,
    Descriptions,
    Timeline,
    Drawer,
    Select,
    Form,
    InputNumber,
    DatePicker,
    Divider,
} from 'antd';
import {
    SearchOutlined,
    UserOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    InfoCircleOutlined,
    HistoryOutlined,
    MailOutlined,
    PhoneOutlined,
    DollarOutlined,
    CalendarOutlined,
    EditOutlined,
    PlusOutlined,
    ExportOutlined,
} from '@ant-design/icons';
import moment from 'moment';

const { Search } = Input;
const { TabPane } = Tabs;
const { Option } = Select;

const Customers = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [subscriptionDetails, setSubscriptionDetails] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerDrawerVisible, setCustomerDrawerVisible] = useState(false);
    const [plans, setPlans] = useState([]);
    const [addSubscriptionVisible, setAddSubscriptionVisible] = useState(false);
    const [subscriptionForm] = Form.useForm();

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/customers');
            setCustomers(response.data);
        } catch (error) {
            message.error('Failed to fetch customers');
        } finally {
            setLoading(false);
        }
    };

    const fetchPlans = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/plans');
            setPlans(response.data);
        } catch (error) {
            message.error('Failed to fetch plans');
        }
    };

    useEffect(() => {
        fetchCustomers();
        fetchPlans();
    }, []);

    const handleSearch = (value) => {
        setSearchText(value);
    };

    const showSubscriptionDetails = (subscription) => {
        setSubscriptionDetails(subscription);
        setModalVisible(true);
    };

    const showCustomerDetails = (customer) => {
        setSelectedCustomer(customer);
        setCustomerDrawerVisible(true);
    };

    const getSubscriptionStatus = (subscription) => {
        if (!subscription) return null;

        const now = new Date();
        const endDate = new Date(subscription.endDate);

        if (now > endDate) {
            return <Tag color="red">Expired</Tag>;
        }

        return <Tag color="green">Active</Tag>;
    };

    const handleAddSubscription = async (values) => {
        if (!selectedCustomer) return;

        try {
            // Format the dates
            values.startDate = values.startDate.toISOString();
            values.endDate = values.endDate.toISOString();

            // Add customer ID to the request
            values.customerId = selectedCustomer._id;

            const response = await axios.post('http://localhost:5000/api/subscriptions', values);
            message.success('Subscription added successfully');
            setAddSubscriptionVisible(false);
            subscriptionForm.resetFields();

            // Refresh customer data
            const updatedCustomer = await axios.get(`http://localhost:5000/api/customers/${selectedCustomer._id}`);
            setSelectedCustomer(updatedCustomer.data);

            // Refresh customers list
            fetchCustomers();
        } catch (error) {
            message.error('Failed to add subscription: ' + (error.response?.data?.message || error.message));
        }
    };

    const exportCustomers = () => {
        // In a real implementation, call an API endpoint that returns a CSV file
        // For now, we'll just show a message
        message.info('Customer data export functionality would be implemented here.');
    };

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            filteredValue: [searchText],
            onFilter: (value, record) =>
                record.name.toLowerCase().includes(value.toLowerCase()) ||
                record.email.toLowerCase().includes(value.toLowerCase()),
            render: (text, record) => (
                <Space>
                    <UserOutlined />
                    <a onClick={() => showCustomerDetails(record)}>{text}</a>
                </Space>
            ),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            render: (email) => (
                <Space>
                    <MailOutlined />
                    {email}
                </Space>
            ),
        },
        {
            title: 'Subscription Status',
            key: 'subscription',
            render: (_, record) => (
                <Space>
                    {record.activeSubscription ? (
                        <>
                            {getSubscriptionStatus(record.activeSubscription)}
                            <span>{record.activeSubscription.plan.name}</span>
                            <Button
                                type="link"
                                icon={<InfoCircleOutlined />}
                                onClick={() => showSubscriptionDetails(record.activeSubscription)}
                            >
                                Details
                            </Button>
                        </>
                    ) : (
                        <Tag color="default">No Active Subscription</Tag>
                    )}
                </Space>
            ),
        },
        {
            title: 'Join Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => (
                <Space>
                    <CalendarOutlined />
                    {new Date(date).toLocaleDateString()}
                </Space>
            ),
        },
        {
            title: 'Total Spend',
            dataIndex: 'totalSpent',
            key: 'totalSpent',
            render: (totalSpent) => (
                <Space>
                    <DollarOutlined />
                    ₹{totalSpent || 0}
                </Space>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        icon={<InfoCircleOutlined />}
                        onClick={() => showCustomerDetails(record)}
                    >
                        View Details
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                <Search
                    placeholder="Search customers by name or email"
                    allowClear
                    enterButton={<SearchOutlined />}
                    size="large"
                    onSearch={handleSearch}
                    style={{ width: 400 }}
                />
                <Button
                    type="primary"
                    icon={<ExportOutlined />}
                    onClick={exportCustomers}
                >
                    Export Customers
                </Button>
            </div>

            <Table
                loading={loading}
                columns={columns}
                dataSource={customers}
                rowKey="_id"
                expandable={{
                    expandedRowRender: (record) => (
                        <div style={{ margin: 0 }}>
                            <Descriptions
                                title="Customer Information"
                                bordered
                                size="small"
                                column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
                            >
                                <Descriptions.Item label="Phone">{record.phone || "N/A"}</Descriptions.Item>
                                <Descriptions.Item label="Address">{record.address || "N/A"}</Descriptions.Item>
                                <Descriptions.Item label="Razorpay Customer ID">{record.razorpayCustomerId || "N/A"}</Descriptions.Item>
                                <Descriptions.Item label="Subscriptions">{record.subscriptionHistory?.length || 0}</Descriptions.Item>
                                <Descriptions.Item label="Last Transaction">{record.lastTransaction ? new Date(record.lastTransaction).toLocaleDateString() : "N/A"}</Descriptions.Item>
                            </Descriptions>
                        </div>
                    ),
                }}
            />

            <Modal
                title="Subscription Details"
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setModalVisible(false)}>
                        Close
                    </Button>,
                ]}
                width={600}
            >
                {subscriptionDetails && (
                    <div>
                        <Descriptions
                            title={`${subscriptionDetails.plan.name} Plan`}
                            bordered
                            column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
                        >
                            <Descriptions.Item label="Price">₹{subscriptionDetails.plan.price}</Descriptions.Item>
                            <Descriptions.Item label="Duration">{subscriptionDetails.plan.duration} months</Descriptions.Item>
                            <Descriptions.Item label="Start Date">{new Date(subscriptionDetails.startDate).toLocaleDateString()}</Descriptions.Item>
                            <Descriptions.Item label="End Date">{new Date(subscriptionDetails.endDate).toLocaleDateString()}</Descriptions.Item>
                            <Descriptions.Item label="Status">{getSubscriptionStatus(subscriptionDetails)}</Descriptions.Item>
                            <Descriptions.Item label="Payment Status">
                                <Tag color={subscriptionDetails.paymentStatus === 'paid' ? 'green' : 'gold'}>
                                    {subscriptionDetails.paymentStatus.toUpperCase()}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Payment ID" span={2}>{subscriptionDetails.paymentId || "N/A"}</Descriptions.Item>
                            <Descriptions.Item label="Notes" span={2}>{subscriptionDetails.notes || "No notes"}</Descriptions.Item>
                        </Descriptions>

                        {subscriptionDetails.plan.features && subscriptionDetails.plan.features.length > 0 && (
                            <div style={{ marginTop: 16 }}>
                                <Divider>Features</Divider>
                                <Space wrap>
                                    {subscriptionDetails.plan.features.map(feature => (
                                        <Tag key={feature} color="blue">{feature}</Tag>
                                    ))}
                                </Space>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            <Drawer
                title={selectedCustomer ? `${selectedCustomer.name} - Customer Details` : 'Customer Details'}
                width={720}
                open={customerDrawerVisible}
                onClose={() => setCustomerDrawerVisible(false)}
                extra={
                    <Space>
                        <Button onClick={() => setCustomerDrawerVisible(false)}>Cancel</Button>
                    </Space>
                }
            >
                {selectedCustomer && (
                    <Tabs defaultActiveKey="1">
                        <TabPane tab="Customer Info" key="1">
                            <Card>
                                <Descriptions title="Customer Information" bordered>
                                    <Descriptions.Item label="Customer ID" span={3}>{selectedCustomer._id}</Descriptions.Item>
                                    <Descriptions.Item label="Name">{selectedCustomer.name}</Descriptions.Item>
                                    <Descriptions.Item label="Email">{selectedCustomer.email}</Descriptions.Item>
                                    <Descriptions.Item label="Phone">{selectedCustomer.phone || "N/A"}</Descriptions.Item>
                                    <Descriptions.Item label="Address" span={3}>{selectedCustomer.address || "N/A"}</Descriptions.Item>
                                    <Descriptions.Item label="Join Date">{new Date(selectedCustomer.createdAt).toLocaleDateString()}</Descriptions.Item>
                                    <Descriptions.Item label="Razorpay ID" span={2}>{selectedCustomer.razorpayCustomerId || "N/A"}</Descriptions.Item>
                                    <Descriptions.Item label="Total Spent">₹{selectedCustomer.totalSpent || 0}</Descriptions.Item>
                                    <Descriptions.Item label="Active Subscription">
                                        {selectedCustomer.activeSubscription ? (
                                            <Space>
                                                {getSubscriptionStatus(selectedCustomer.activeSubscription)}
                                                {selectedCustomer.activeSubscription.plan.name}
                                            </Space>
                                        ) : (
                                            <Tag color="default">No Active Subscription</Tag>
                                        )}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Notes" span={3}>{selectedCustomer.notes || "No notes"}</Descriptions.Item>
                                </Descriptions>
                            </Card>
                        </TabPane>

                        <TabPane tab="Subscriptions" key="2">
                            <div style={{ marginBottom: 16 }}>
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => setAddSubscriptionVisible(true)}
                                >
                                    Add Subscription
                                </Button>
                            </div>

                            {selectedCustomer.subscriptionHistory && selectedCustomer.subscriptionHistory.length > 0 ? (
                                <Table
                                    dataSource={selectedCustomer.subscriptionHistory}
                                    rowKey="_id"
                                    pagination={false}
                                    columns={[
                                        {
                                            title: 'Plan',
                                            dataIndex: ['plan', 'name'],
                                            key: 'planName',
                                        },
                                        {
                                            title: 'Status',
                                            key: 'status',
                                            render: (_, record) => getSubscriptionStatus(record),
                                        },
                                        {
                                            title: 'Start Date',
                                            dataIndex: 'startDate',
                                            key: 'startDate',
                                            render: (date) => new Date(date).toLocaleDateString(),
                                        },
                                        {
                                            title: 'End Date',
                                            dataIndex: 'endDate',
                                            key: 'endDate',
                                            render: (date) => new Date(date).toLocaleDateString(),
                                        },
                                        {
                                            title: 'Price',
                                            dataIndex: ['plan', 'price'],
                                            key: 'price',
                                            render: (price) => `₹${price}`,
                                        },
                                        {
                                            title: 'Actions',
                                            key: 'action',
                                            render: (_, record) => (
                                                <Button
                                                    type="link"
                                                    onClick={() => showSubscriptionDetails(record)}
                                                >
                                                    View Details
                                                </Button>
                                            ),
                                        },
                                    ]}
                                />
                            ) : (
                                <div style={{ textAlign: 'center', padding: '20px' }}>
                                    <p>No subscription history found</p>
                                </div>
                            )}
                        </TabPane>

                        <TabPane tab="Transactions" key="3">
                            {selectedCustomer.transactions && selectedCustomer.transactions.length > 0 ? (
                                <Timeline mode="left">
                                    {selectedCustomer.transactions.map((transaction, index) => (
                                        <Timeline.Item
                                            key={index}
                                            color={transaction.status === 'success' ? 'green' : transaction.status === 'pending' ? 'blue' : 'red'}
                                            label={new Date(transaction.date).toLocaleDateString()}
                                        >
                                            <p><strong>{transaction.description}</strong></p>
                                            <p>Amount: ₹{transaction.amount}</p>
                                            <p>Status: <Tag color={transaction.status === 'success' ? 'green' : transaction.status === 'pending' ? 'blue' : 'red'}>{transaction.status}</Tag></p>
                                            {transaction.paymentId && <p>Payment ID: {transaction.paymentId}</p>}
                                        </Timeline.Item>
                                    ))}
                                </Timeline>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '20px' }}>
                                    <p>No transaction history found</p>
                                </div>
                            )}
                        </TabPane>
                    </Tabs>
                )}
            </Drawer>

            <Modal
                title="Add Subscription"
                open={addSubscriptionVisible}
                onCancel={() => {
                    setAddSubscriptionVisible(false);
                    subscriptionForm.resetFields();
                }}
                footer={null}
                width={600}
            >
                <Form
                    form={subscriptionForm}
                    layout="vertical"
                    onFinish={handleAddSubscription}
                    initialValues={{
                        startDate: moment(),
                        paymentStatus: 'paid'
                    }}
                >
                    <Form.Item
                        name="planId"
                        label="Plan"
                        rules={[{ required: true, message: 'Please select a plan' }]}
                    >
                        <Select>
                            {plans.map(plan => (
                                <Option key={plan._id} value={plan._id}>
                                    {plan.name} - ₹{plan.price}/mo ({plan.duration} months)
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="startDate"
                        label="Start Date"
                        rules={[{ required: true, message: 'Please select start date' }]}
                    >
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        name="endDate"
                        label="End Date"
                        rules={[{ required: true, message: 'Please select end date' }]}
                    >
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                        name="paymentStatus"
                        label="Payment Status"
                        rules={[{ required: true, message: 'Please select payment status' }]}
                    >
                        <Select>
                            <Option value="paid">Paid</Option>
                            <Option value="pending">Pending</Option>
                            <Option value="failed">Failed</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="paymentId"
                        label="Payment ID"
                    >
                        <Input placeholder="Optional: Enter payment ID if available" />
                    </Form.Item>

                    <Form.Item
                        name="notes"
                        label="Notes"
                    >
                        <Input.TextArea rows={4} placeholder="Optional: Add any notes about this subscription" />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit">
                                Add Subscription
                            </Button>
                            <Button onClick={() => {
                                setAddSubscriptionVisible(false);
                                subscriptionForm.resetFields();
                            }}>
                                Cancel
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Customers; 