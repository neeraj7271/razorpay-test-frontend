import React, { useState, useEffect } from 'react';
import {
    Card,
    Button,
    Table,
    Modal,
    Form,
    Input,
    InputNumber,
    Space,
    message,
    Popconfirm,
    Tabs,
    Select,
    Tag,
    Switch,
    Tooltip,
    Divider,
    Empty,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    TagOutlined,
    PercentageOutlined,
    InfoCircleOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const { TabPane } = Tabs;
const { Option } = Select;

const Plans = () => {
    const [plans, setPlans] = useState([]);
    const [discounts, setDiscounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [discountModalVisible, setDiscountModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [discountForm] = Form.useForm();
    const [editingPlan, setEditingPlan] = useState(null);
    const [editingDiscount, setEditingDiscount] = useState(null);
    const [activeTab, setActiveTab] = useState('1');

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/plans');
            console.log("API response for plans:", response.data);

            // Ensure plans is always an array
            if (Array.isArray(response.data)) {
                setPlans(response.data);
            }
            // Check if response.data is an object with a plans or data property
            else if (response.data && typeof response.data === 'object') {
                const plansArray = response.data.plans || response.data.data || [];
                setPlans(Array.isArray(plansArray) ? plansArray : []);
            }
            // Fallback to empty array
            else {
                setPlans([]);
            }
        } catch (error) {
            console.error("Error fetching plans:", error);
            message.error('Failed to fetch plans');
            setPlans([]); // Set to empty array on error
        } finally {
            setLoading(false);
        }
    };

    const fetchDiscounts = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/discounts');
            console.log("API response for discounts:", response.data);

            // Ensure discounts is always an array
            if (Array.isArray(response.data)) {
                setDiscounts(response.data);
            }
            // Check if response.data is an object with a discounts or data property
            else if (response.data && typeof response.data === 'object') {
                const discountsArray = response.data.discounts || response.data.data || [];
                setDiscounts(Array.isArray(discountsArray) ? discountsArray : []);
            }
            // Fallback to empty array
            else {
                setDiscounts([]);
            }
        } catch (error) {
            console.error("Error fetching discounts:", error);
            message.error('Failed to fetch discounts');
            setDiscounts([]); // Set to empty array on error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
        fetchDiscounts();
    }, []);

    const handleSubmit = async (values) => {
        try {
            // Show loading message
            const loadingMessage = message.loading('Processing plan...', 0);

            // Add features as an array if it's in a comma-separated string format
            if (typeof values.features === 'string') {
                values.features = values.features.split(',').map(feature => feature.trim());
            }

            // Create plan in Razorpay first if this is a new plan and createInRazorpay is checked
            let razorpayPlanId = values.planId || (editingPlan && editingPlan.planId);

            if (values.createInRazorpay && !editingPlan) {
                try {
                    // Create Razorpay plan via our backend
                    const razorpayResponse = await axios.post('http://localhost:5000/api/razorpay/create-plan', {
                        name: values.name,
                        description: values.description,
                        amount: values.price * 100, // Convert to paise
                        interval: 'month',
                        period: values.duration,
                        notes: {
                            features: Array.isArray(values.features)
                                ? values.features.join(', ')
                                : values.features
                        }
                    });

                    // Store the Razorpay plan ID
                    if (razorpayResponse.data && razorpayResponse.data.id) {
                        razorpayPlanId = razorpayResponse.data.id;
                        values.planId = razorpayPlanId;

                        // Store API response for debugging
                        if (window.setApiResponses) {
                            window.setApiResponses(prev => ({
                                ...prev,
                                ['Create Razorpay Plan']: razorpayResponse.data
                            }));
                        }
                    }
                } catch (razorpayError) {
                    console.error('Error creating plan in Razorpay:', razorpayError);
                    message.error(razorpayError.response?.data?.message || 'Failed to create plan in Razorpay');
                    loadingMessage();
                    return;
                }
            }

            // Then save to our database
            if (editingPlan) {
                await axios.put(`http://localhost:5000/api/plans/${editingPlan._id}`, values);
                message.success('Plan updated successfully');
            } else {
                await axios.post('http://localhost:5000/api/plans', values);
                message.success('Plan created successfully');
            }

            // Close loading message
            loadingMessage();

            setModalVisible(false);
            form.resetFields();
            setEditingPlan(null);
            fetchPlans();
        } catch (error) {
            message.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleEdit = (record) => {
        // Convert features array to comma-separated string for editing if it's an array
        const planToEdit = { ...record };
        if (Array.isArray(planToEdit.features)) {
            planToEdit.features = planToEdit.features.join(', ');
        }
        setEditingPlan(planToEdit);
        form.setFieldsValue(planToEdit);
        setModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/api/plans/${id}`);
            message.success('Plan deleted successfully');
            fetchPlans();
        } catch (error) {
            message.error('Failed to delete plan');
        }
    };

    const handleDiscountSubmit = async (values) => {
        try {
            if (editingDiscount) {
                await axios.put(`http://localhost:5000/api/discounts/${editingDiscount._id}`, values);
                message.success('Discount updated successfully');
            } else {
                await axios.post('http://localhost:5000/api/discounts', values);
                message.success('Discount created successfully');
            }
            setDiscountModalVisible(false);
            discountForm.resetFields();
            setEditingDiscount(null);
            fetchDiscounts();
        } catch (error) {
            message.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleEditDiscount = (record) => {
        setEditingDiscount(record);
        discountForm.setFieldsValue(record);
        setDiscountModalVisible(true);
    };

    const handleDeleteDiscount = async (id) => {
        try {
            await axios.delete(`http://localhost:5000/api/discounts/${id}`);
            message.success('Discount deleted successfully');
            fetchDiscounts();
        } catch (error) {
            message.error('Failed to delete discount');
        }
    };

    const planColumns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            render: (price) => `₹${price}`,
        },
        {
            title: 'Duration (months)',
            dataIndex: 'duration',
            key: 'duration',
        },
        {
            title: 'Features',
            dataIndex: 'features',
            key: 'features',
            render: (features) => (
                <>
                    {Array.isArray(features) && features.map((feature) => (
                        <Tag color="blue" key={feature}>
                            {feature}
                        </Tag>
                    ))}
                </>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    >
                        Edit
                    </Button>
                    <Popconfirm
                        title="Are you sure you want to delete this plan?"
                        onConfirm={() => handleDelete(record._id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button type="primary" danger icon={<DeleteOutlined />}>
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    const discountColumns = [
        {
            title: 'Code',
            dataIndex: 'code',
            key: 'code',
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
            render: (type) => (
                <Tag color={type === 'percentage' ? 'green' : 'blue'}>
                    {type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                </Tag>
            ),
        },
        {
            title: 'Value',
            key: 'value',
            render: (_, record) => (
                <span>
                    {record.type === 'percentage' ? `${record.value}%` : `₹${record.value}`}
                </span>
            ),
        },
        {
            title: 'Applicable Plans',
            dataIndex: 'applicablePlans',
            key: 'applicablePlans',
            render: (applicablePlans) => (
                <>
                    {!Array.isArray(applicablePlans) || applicablePlans.length === 0 ? (
                        <Tag>All Plans</Tag>
                    ) : (
                        applicablePlans.map((plan) => {
                            const planName = Array.isArray(plans) ?
                                (plans.find(p => p._id === plan || p.id === plan)?.name || plan) :
                                plan;
                            return (
                                <Tag color="purple" key={plan}>
                                    {planName}
                                </Tag>
                            );
                        })
                    )}
                </>
            ),
        },
        {
            title: 'Active',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive) => (
                <Tag color={isActive ? 'green' : 'red'}>
                    {isActive ? 'Active' : 'Inactive'}
                </Tag>
            ),
        },
        {
            title: 'Expiry Date',
            dataIndex: 'expiryDate',
            key: 'expiryDate',
            render: (date) => date ? new Date(date).toLocaleDateString() : 'No Expiry',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => handleEditDiscount(record)}
                    >
                        Edit
                    </Button>
                    <Popconfirm
                        title="Are you sure you want to delete this discount?"
                        onConfirm={() => handleDeleteDiscount(record._id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button type="primary" danger icon={<DeleteOutlined />}>
                            Delete
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
                <TabPane tab="Plans" key="1">
                    <div className="plans-header">
                        <h2>Subscription Plans</h2>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                setEditingPlan(null);
                                form.resetFields();
                                setModalVisible(true);
                            }}
                        >
                            Add New Plan
                        </Button>
                    </div>

                    <Table
                        loading={loading}
                        columns={planColumns}
                        dataSource={Array.isArray(plans) ? plans : []}
                        rowKey={(record) => record._id || record.id || Math.random().toString()}
                        locale={{
                            emptyText: <Empty description="No plans found" />
                        }}
                    />

                    <Modal
                        title={editingPlan ? 'Edit Plan' : 'Create New Plan'}
                        open={modalVisible}
                        onCancel={() => {
                            setModalVisible(false);
                            form.resetFields();
                            setEditingPlan(null);
                        }}
                        footer={null}
                        width={700}
                    >
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleSubmit}
                            initialValues={{
                                createInRazorpay: !editingPlan, // Default to true for new plans
                                period: 'monthly'
                            }}
                        >
                            <Divider orientation="left">Basic Plan Details</Divider>

                            <Form.Item
                                name="name"
                                label="Plan Name"
                                rules={[{ required: true, message: 'Please enter plan name' }]}
                            >
                                <Input />
                            </Form.Item>

                            <Form.Item
                                name="description"
                                label="Description"
                                rules={[{ required: true, message: 'Please enter description' }]}
                            >
                                <Input.TextArea rows={4} />
                            </Form.Item>

                            <Form.Item
                                name="price"
                                label="Price (₹)"
                                rules={[{ required: true, message: 'Please enter price' }]}
                            >
                                <InputNumber
                                    min={0}
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>

                            <Form.Item
                                name="duration"
                                label="Duration (months)"
                                rules={[{ required: true, message: 'Please enter duration' }]}
                            >
                                <InputNumber
                                    min={1}
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>

                            <Form.Item
                                name="features"
                                label={
                                    <span>
                                        Features
                                        <Tooltip title="Enter comma-separated list of features">
                                            <InfoCircleOutlined style={{ marginLeft: 8 }} />
                                        </Tooltip>
                                    </span>
                                }
                                rules={[{ required: true, message: 'Please enter features' }]}
                            >
                                <Input.TextArea
                                    rows={4}
                                    placeholder="Enter features separated by commas (e.g., Feature 1, Feature 2, Feature 3)"
                                />
                            </Form.Item>

                            <Divider orientation="left">Razorpay Integration</Divider>

                            {!editingPlan && (
                                <Form.Item
                                    name="createInRazorpay"
                                    valuePropName="checked"
                                    label={
                                        <span>
                                            Create in Razorpay
                                            <Tooltip title="Automatically create this plan in Razorpay when saved">
                                                <InfoCircleOutlined style={{ marginLeft: 8 }} />
                                            </Tooltip>
                                        </span>
                                    }
                                >
                                    <Switch />
                                </Form.Item>
                            )}

                            <Form.Item
                                name="planId"
                                label={
                                    <span>
                                        Razorpay Plan ID
                                        <Tooltip title="Enter the Razorpay Plan ID if you have manually created this plan in Razorpay">
                                            <InfoCircleOutlined style={{ marginLeft: 8 }} />
                                        </Tooltip>
                                    </span>
                                }
                            >
                                <Input placeholder="Optional: Enter Razorpay Plan ID" />
                            </Form.Item>

                            <Form.Item
                                name="period"
                                label="Billing Period"
                                tooltip="How often the customer will be billed"
                            >
                                <Select>
                                    <Option value="daily">Daily</Option>
                                    <Option value="weekly">Weekly</Option>
                                    <Option value="monthly">Monthly</Option>
                                    <Option value="yearly">Yearly</Option>
                                </Select>
                            </Form.Item>

                            <Form.Item>
                                <Space>
                                    <Button type="primary" htmlType="submit">
                                        {editingPlan ? 'Update Plan' : 'Create Plan'}
                                    </Button>
                                    <Button onClick={() => {
                                        setModalVisible(false);
                                        form.resetFields();
                                        setEditingPlan(null);
                                    }}>
                                        Cancel
                                    </Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </Modal>
                </TabPane>

                <TabPane tab="Discounts" key="2">
                    <div className="plans-header">
                        <h2>Discount Codes</h2>
                        <Button
                            type="primary"
                            icon={<TagOutlined />}
                            onClick={() => {
                                setEditingDiscount(null);
                                discountForm.resetFields();
                                setDiscountModalVisible(true);
                            }}
                        >
                            Add New Discount
                        </Button>
                    </div>

                    <Table
                        loading={loading}
                        columns={discountColumns}
                        dataSource={Array.isArray(discounts) ? discounts : []}
                        rowKey={(record) => record._id || record.id || Math.random().toString()}
                        locale={{
                            emptyText: <Empty description="No discount codes found" />
                        }}
                    />

                    <Modal
                        title={editingDiscount ? 'Edit Discount' : 'Create New Discount'}
                        open={discountModalVisible}
                        onCancel={() => {
                            setDiscountModalVisible(false);
                            discountForm.resetFields();
                            setEditingDiscount(null);
                        }}
                        footer={null}
                        width={700}
                    >
                        <Form
                            form={discountForm}
                            layout="vertical"
                            onFinish={handleDiscountSubmit}
                        >
                            <Form.Item
                                name="code"
                                label="Discount Code"
                                rules={[{ required: true, message: 'Please enter discount code' }]}
                            >
                                <Input placeholder="e.g., SUMMER20" />
                            </Form.Item>

                            <Form.Item
                                name="type"
                                label="Discount Type"
                                rules={[{ required: true, message: 'Please select discount type' }]}
                            >
                                <Select>
                                    <Option value="percentage">Percentage</Option>
                                    <Option value="fixed">Fixed Amount</Option>
                                </Select>
                            </Form.Item>

                            <Form.Item
                                name="value"
                                label="Discount Value"
                                rules={[{ required: true, message: 'Please enter discount value' }]}
                            >
                                <InputNumber
                                    min={0}
                                    style={{ width: '100%' }}
                                    formatter={(value) => {
                                        const formValues = discountForm.getFieldsValue();
                                        return formValues.type === 'percentage'
                                            ? `${value}%`
                                            : `₹ ${value}`;
                                    }}
                                    parser={(value) => {
                                        return value.replace(/\₹\s?|(,*)/g, '').replace('%', '');
                                    }}
                                />
                            </Form.Item>

                            <Form.Item
                                name="applicablePlans"
                                label={
                                    <span>
                                        Applicable Plans
                                        <Tooltip title="Leave empty to apply to all plans">
                                            <InfoCircleOutlined style={{ marginLeft: 8 }} />
                                        </Tooltip>
                                    </span>
                                }
                            >
                                <Select
                                    mode="multiple"
                                    placeholder="Select applicable plans (leave empty for all plans)"
                                    optionFilterProp="children"
                                >
                                    {Array.isArray(plans) && plans.map(plan => (
                                        <Option key={plan._id || plan.id || Math.random().toString()} value={plan._id || plan.id}>
                                            {plan.name}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>

                            <Form.Item
                                name="maxUses"
                                label="Maximum Uses"
                                tooltip="Maximum number of times this discount can be used (0 for unlimited)"
                            >
                                <InputNumber min={0} style={{ width: '100%' }} placeholder="0 for unlimited" />
                            </Form.Item>

                            <Form.Item
                                name="expiryDate"
                                label="Expiry Date"
                                tooltip="Leave empty for no expiry"
                            >
                                <Input type="date" />
                            </Form.Item>

                            <Form.Item
                                name="isActive"
                                label="Active"
                                valuePropName="checked"
                                initialValue={true}
                            >
                                <Switch />
                            </Form.Item>

                            <Divider />

                            <Form.Item>
                                <Space>
                                    <Button type="primary" htmlType="submit" icon={<TagOutlined />}>
                                        {editingDiscount ? 'Update Discount' : 'Create Discount'}
                                    </Button>
                                    <Button onClick={() => {
                                        setDiscountModalVisible(false);
                                        discountForm.resetFields();
                                        setEditingDiscount(null);
                                    }}>
                                        Cancel
                                    </Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </Modal>
                </TabPane>
            </Tabs>
        </div>
    );
};

export default Plans; 