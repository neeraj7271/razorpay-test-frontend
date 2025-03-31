import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, DatePicker, Space, Button, Select, Alert } from 'antd';
import {
    UserOutlined,
    CrownOutlined,
    DollarOutlined,
    ClockCircleOutlined,
    CalendarOutlined,
    BarChartOutlined,
    PieChartOutlined,
    RiseOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { RangePicker } = DatePicker;
const { Option } = Select;

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalCustomers: 0,
        activeSubscriptions: 0,
        totalRevenue: 0,
        recentTransactions: [],
        avgSubscriptionDuration: 0,
        subscriptionsByPlan: [],
        revenueByMonth: [],
    });
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState([null, null]);
    const [timeFilter, setTimeFilter] = useState('week');

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            // Format dates for API if selected
            const params = {};
            if (dateRange[0] && dateRange[1]) {
                params.startDate = dateRange[0].toISOString();
                params.endDate = dateRange[1].toISOString();
            } else if (timeFilter) {
                params.timeFilter = timeFilter;
            }

            const response = await axios.get('http://localhost:5000/api/admin/dashboard', { params });
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardStats();
    }, [timeFilter]);

    const handleDateRangeChange = (dates) => {
        setDateRange(dates);
        if (dates && dates[0] && dates[1]) {
            setTimeFilter(null); // Clear the time filter when custom date range is selected
        }
    };

    const handleTimeFilterChange = (value) => {
        setTimeFilter(value);
        setDateRange([null, null]); // Clear date range when time filter changes
    };

    const applyDateFilter = () => {
        fetchDashboardStats();
    };

    const transactionColumns = [
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
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount) => `₹${amount}`,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <Tag color={status === 'success' ? 'green' : status === 'pending' ? 'gold' : 'red'}>
                    {status.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (date) => new Date(date).toLocaleDateString(),
        },
    ];

    const subscriptionsByPlanColumns = [
        {
            title: 'Plan',
            dataIndex: 'planName',
            key: 'planName',
        },
        {
            title: 'Active Subscriptions',
            dataIndex: 'activeCount',
            key: 'activeCount',
        },
        {
            title: 'Total Revenue',
            dataIndex: 'revenue',
            key: 'revenue',
            render: (revenue) => `₹${revenue}`,
        },
        {
            title: 'Conversion Rate',
            dataIndex: 'conversionRate',
            key: 'conversionRate',
            render: (rate) => `${rate}%`,
        },
    ];

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <Space size="large" style={{ marginBottom: 16 }}>
                    <Select
                        value={timeFilter}
                        onChange={handleTimeFilterChange}
                        style={{ width: 150 }}
                        disabled={dateRange[0] && dateRange[1]}
                    >
                        <Option value="today">Today</Option>
                        <Option value="week">This Week</Option>
                        <Option value="month">This Month</Option>
                        <Option value="quarter">This Quarter</Option>
                        <Option value="year">This Year</Option>
                    </Select>
                    <RangePicker
                        value={dateRange}
                        onChange={handleDateRangeChange}
                        disabled={Boolean(timeFilter)}
                    />
                    <Button type="primary" onClick={applyDateFilter}>
                        Apply Filter
                    </Button>
                </Space>

                {(dateRange[0] && dateRange[1]) && (
                    <Alert
                        message={`Showing stats from ${dateRange[0].format('MMMM D, YYYY')} to ${dateRange[1].format('MMMM D, YYYY')}`}
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                )}
            </div>

            <h2>Dashboard Overview</h2>

            <div className="dashboard-stats">
                <Row gutter={16}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Total Customers"
                                value={stats.totalCustomers}
                                prefix={<UserOutlined />}
                                loading={loading}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Active Subscriptions"
                                value={stats.activeSubscriptions}
                                prefix={<CrownOutlined />}
                                loading={loading}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Total Revenue"
                                value={stats.totalRevenue}
                                prefix="₹"
                                loading={loading}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Avg. Subscription Duration"
                                value={stats.avgSubscriptionDuration || 0}
                                suffix="months"
                                prefix={<ClockCircleOutlined />}
                                loading={loading}
                            />
                        </Card>
                    </Col>
                </Row>
            </div>

            <Row gutter={24} style={{ marginTop: 24 }}>
                <Col span={24} lg={12}>
                    <Card
                        title={
                            <Space>
                                <BarChartOutlined />
                                <span>Subscription Distribution by Plan</span>
                            </Space>
                        }
                        className="dashboard-card"
                    >
                        <Table
                            dataSource={stats.subscriptionsByPlan || []}
                            columns={subscriptionsByPlanColumns}
                            pagination={false}
                            loading={loading}
                            rowKey="planId"
                            size="small"
                        />
                    </Card>
                </Col>

                <Col span={24} lg={12}>
                    <Card
                        title={
                            <Space>
                                <RiseOutlined />
                                <span>Recent Revenue Trends</span>
                            </Space>
                        }
                        className="dashboard-card"
                    >
                        {/* Placeholder for a chart component */}
                        <div style={{ height: 250, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <p style={{ color: '#999' }}>
                                Revenue trend chart would display here.
                                <br />
                                Implement with a chart library like Chart.js or Recharts.
                            </p>
                        </div>
                    </Card>
                </Col>
            </Row>

            <div style={{ marginTop: '24px' }}>
                <Card
                    title={
                        <Space>
                            <CalendarOutlined />
                            <span>Recent Transactions</span>
                        </Space>
                    }
                    className="dashboard-card"
                >
                    <Table
                        columns={transactionColumns}
                        dataSource={stats.recentTransactions}
                        loading={loading}
                        rowKey="id"
                        pagination={{ pageSize: 5 }}
                    />
                </Card>
            </div>
        </div>
    );
};

export default Dashboard; 