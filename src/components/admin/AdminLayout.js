import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, theme, Drawer } from 'antd';
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    DashboardOutlined,
    AppstoreOutlined,
    UserOutlined,
    LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import './Admin.css';

const { Header, Sider, Content } = Layout;

const AdminLayout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
            if (window.innerWidth > 768) {
                setMobileDrawerVisible(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const menuItems = [
        {
            key: '/admin/dashboard',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
        },
        {
            key: '/admin/plans',
            icon: <AppstoreOutlined />,
            label: 'Plans',
        },
        {
            key: '/admin/customers',
            icon: <UserOutlined />,
            label: 'Customers',
        },
    ];

    const sidebarContent = (
        <>
            <div className="admin-logo">
                {collapsed && !isMobile ? 'R' : 'Razorpay Admin'}
            </div>
            <Menu
                theme="dark"
                mode="inline"
                selectedKeys={[location.pathname]}
                items={menuItems}
                onClick={({ key }) => {
                    navigate(key);
                    if (isMobile) {
                        setMobileDrawerVisible(false);
                    }
                }}
            />
        </>
    );

    return (
        <Layout className="admin-layout">
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
                    className="admin-sider"
                >
                    {sidebarContent}
                </Sider>
            )}
            <Layout className="admin-layout-content">
                <Header className="admin-header" style={{ background: colorBgContainer }}>
                    <Button
                        type="text"
                        icon={isMobile ? <MenuUnfoldOutlined /> : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
                        onClick={() => isMobile ? setMobileDrawerVisible(true) : setCollapsed(!collapsed)}
                        className="trigger-button"
                    />
                    <Button
                        type="text"
                        icon={<LogoutOutlined />}
                        onClick={handleLogout}
                        className="logout-button"
                    >
                        {isMobile ? '' : 'Logout'}
                    </Button>
                </Header>
                <Content className="admin-content">
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default AdminLayout; 