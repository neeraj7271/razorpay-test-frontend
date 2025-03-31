import React, { useState, useEffect } from 'react';
import {
    Card,
    Typography,
    Button,
    Input,
    Modal,
    Space,
    Table,
    Tag,
    message,
    Alert,
    Spin,
    Row,
    Col
} from 'antd';
import {
    SearchOutlined,
    EditOutlined,
    DeleteOutlined,
    CloseOutlined
} from '@ant-design/icons';
import axios from 'axios';
import './Admin.css';

const { Title, Text } = Typography;

const Subscriptions = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedSubscription, setSelectedSubscription] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const fetchSubscriptions = async () => {
        try {
            const response = await axios.get('http://localhost:5000/admin/subscriptions', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            // Transform data to match Ant Design Table format
            const formattedData = response.data.map(item => ({
                ...item,
                key: item.id // Ant Design Table requires a 'key' prop
            }));

            setSubscriptions(formattedData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
            setLoading(false);
            message.error('Failed to load subscriptions');
        }
    };

    const handleCancelSubscription = async () => {
        try {
            await axios.post(
                `http://localhost:5000/admin/subscriptions/${selectedSubscription.id}/cancel`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );
            fetchSubscriptions();
            setOpenDialog(false);
            message.success('Subscription cancelled successfully');
        } catch (error) {
            setError(error.response?.data?.message || 'Error canceling subscription');
            message.error('Failed to cancel subscription');
        }
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 90
        },
        {
            title: 'Customer',
            dataIndex: 'customerName',
            key: 'customerName',
            width: 200,
            sorter: (a, b) => a.customerName.localeCompare(b.customerName)
        },
        {
            title: 'Plan',
            dataIndex: 'planName',
            key: 'planName',
            width: 150
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status) => {
                let color = '';
                if (status === 'active') {
                    color = 'green';
                } else if (status === 'cancelled') {
                    color = 'red';
                } else {
                    color = 'orange';
                }
                return (
                    <Tag color={color} key={status}>
                        {status.toUpperCase()}
                    </Tag>
                );
            },
            filters: [
                { text: 'Active', value: 'active' },
                { text: 'Cancelled', value: 'cancelled' },
                { text: 'Pending', value: 'pending' }
            ],
            onFilter: (value, record) => record.status === value
        },
        {
            title: 'Start Date',
            dataIndex: 'startDate',
            key: 'startDate',
            width: 180,
            render: (date) => new Date(date).toLocaleDateString()
        },
        {
            title: 'End Date',
            dataIndex: 'endDate',
            key: 'endDate',
            width: 180,
            render: (date) => new Date(date).toLocaleDateString()
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            width: 120,
            render: (amount) => `₹${amount.toLocaleString()}`
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 150,
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => {
                            // Handle edit action
                        }}
                    />
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => {
                            setSelectedSubscription(record);
                            setOpenDialog(true);
                        }}
                        disabled={record.status !== 'active'}
                    />
                </Space>
            )
        },
    ];

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredSubscriptions = searchTerm
        ? subscriptions.filter(
            (subscription) =>
                subscription.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                subscription.planName.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : subscriptions;

    return (
        <div className="admin-content-container">
            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                <Col>
                    <Title level={4}>Subscriptions</Title>
                </Col>
                <Col>
                    <Input
                        placeholder="Search subscriptions..."
                        prefix={<SearchOutlined />}
                        value={searchTerm}
                        onChange={handleSearch}
                        style={{ width: 250 }}
                        allowClear
                    />
                </Col>
            </Row>

            <Card className="admin-data-card">
                <Table
                    columns={columns}
                    dataSource={filteredSubscriptions}
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 1100 }}
                    rowClassName="subscription-table-row"
                />
            </Card>

            {/* Cancel Subscription Modal */}
            <Modal
                title="Cancel Subscription"
                open={openDialog}
                onCancel={() => setOpenDialog(false)}
                footer={[
                    <Button key="back" onClick={() => setOpenDialog(false)}>
                        Cancel
                    </Button>,
                    <Button key="submit" danger onClick={handleCancelSubscription}>
                        Confirm Cancellation
                    </Button>,
                ]}
            >
                {error && <Alert message={error} type="error" style={{ marginBottom: 16 }} />}
                <p>Are you sure you want to cancel the subscription for {selectedSubscription?.customerName}?</p>
                <Text type="secondary">This action cannot be undone.</Text>
            </Modal>
        </div>
    );
};

export default Subscriptions; 