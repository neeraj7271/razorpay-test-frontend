import React, { useState, useEffect } from 'react';
import {
    Table,
    Input,
    Typography,
    Button,
    Modal,
    Space,
    Tag,
    message,
    Card,
    Tooltip
} from 'antd';
import {
    SearchOutlined,
    EditOutlined,
    DeleteOutlined,
    CloseOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Search } = Input;
const { Title } = Typography;
const { confirm } = Modal;

const Subscriptions = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmModal, setConfirmModal] = useState(false);
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
            setSubscriptions(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
            setLoading(false);
            message.error('Failed to fetch subscriptions');
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
            setConfirmModal(false);
            message.success('Subscription cancelled successfully');
        } catch (error) {
            setError(error.response?.data?.message || 'Error canceling subscription');
            message.error('Failed to cancel subscription: ' + error.response?.data?.message || error.message);
        }
    };

    const showCancelConfirm = (subscription) => {
        setSelectedSubscription(subscription);
        setConfirmModal(true);
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'Customer',
            dataIndex: 'customerName',
            key: 'customerName',
        },
        {
            title: 'Plan',
            dataIndex: 'planName',
            key: 'planName',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = 'default';
                if (status === 'active') color = 'green';
                else if (status === 'cancelled') color = 'red';
                else if (status === 'pending') color = 'orange';

                return <Tag color={color}>{status.toUpperCase()}</Tag>;
            }
        },
        {
            title: 'Start Date',
            dataIndex: 'startDate',
            key: 'startDate',
            render: (date) => new Date(date).toLocaleDateString()
        },
        {
            title: 'End Date',
            dataIndex: 'endDate',
            key: 'endDate',
            render: (date) => new Date(date).toLocaleDateString()
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount) => `₹${amount.toLocaleString()}`
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Edit">
                        <Button
                            icon={<EditOutlined />}
                            type="text"
                            onClick={() => {
                                // Handle edit action
                            }}
                        />
                    </Tooltip>
                    <Tooltip title="Cancel">
                        <Button
                            icon={<DeleteOutlined />}
                            type="text"
                            danger
                            disabled={record.status !== 'active'}
                            onClick={() => showCancelConfirm(record)}
                        />
                    </Tooltip>
                </Space>
            )
        }
    ];

    const filteredSubscriptions = subscriptions.filter(
        (subscription) =>
            subscription.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            subscription.planName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Title level={4}>Subscriptions</Title>
                <Search
                    placeholder="Search subscriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: 250 }}
                    prefix={<SearchOutlined />}
                />
            </div>

            <Card>
                <Table
                    dataSource={filteredSubscriptions}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            <Modal
                title="Cancel Subscription"
                open={confirmModal}
                onOk={handleCancelSubscription}
                onCancel={() => setConfirmModal(false)}
                okText="Yes, Cancel"
                cancelText="No, Keep It"
                okButtonProps={{ danger: true }}
            >
                <p>Are you sure you want to cancel this subscription?</p>
                <p>This action cannot be undone.</p>
                {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
            </Modal>
        </div>
    );
};

export default Subscriptions; 