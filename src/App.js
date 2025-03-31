import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';
import SubscriptionModal from './components/SubscriptionModal';
import ResponseSidebar from './components/ResponseSidebar';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './components/admin/Dashboard';
import Plans from './components/admin/Plans';
import Customers from './components/admin/Customers';
import UserDashboard from './components/user/UserDashboard';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { ConfigProvider } from 'antd';
import { message } from 'antd';

function App() {
  const [loadingStates, setLoadingStates] = useState({});
  const [plans, setPlans] = useState([]); // Add state for plans
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiResponses, setApiResponses] = useState({});

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    // Make API responses sidebar globally available
    window.setApiResponses = (responses) => {
      setApiResponses(prev => ({
        ...prev,
        ...responses
      }));
      setSidebarOpen(true);
    };

    return () => {
      document.body.removeChild(script);
      delete window.setApiResponses;
    };
  }, []);

  // Fetch plans when component mounts
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axios.get("https://razorpay-testing-backend.vercel.app/api/plans");
        setPlans(response.data.plans || []);

        // Store the response
        setApiResponses(prev => ({
          ...prev,
          "Get Plans": response.data
        }));

        console.log(response.data.plans);
      } catch (error) {
        console.error("Error fetching plans:", error);
        setPlans([]);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch plans if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      fetchPlans();
    } else {
      setLoading(false);
    }
  }, []);

  // Add this helper function to check if user is admin
  const isAdmin = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role === 'admin';
  };

  const createOrder = async (plan) => {
    // Don't allow admin to purchase
    if (isAdmin()) {
      message.info('As an admin, you cannot purchase plans.');
      return;
    }

    if (!plan || !plan.name) {
      message.error('Invalid plan data');
      return;
    }

    setLoadingStates((prev) => ({ ...prev, [plan.name]: true }));

    try {
      console.log(`Creating order for: ${plan.name}`);

      // ✅ Step 1: Create Order via Backend
      const { data } = await axios.post("https://razorpay-testing-backend.vercel.app/api/create-order", {
        receipt: plan.name,
        amount: parseFloat(plan.price.replace("₹", "")), // Convert to paise
      });

      console.log("Order created:", data);

      // ✅ Step 2: Define Razorpay Payment Options
      const options = {
        // key: "rzp_test_dWLBx9Ob7rYIdJ", // ✅ Replace with your Razorpay Key ID
        amount: data.amount,
        currency: "INR",
        name: "Neeraj Suman",
        description: `Payment for ${plan.name} Plan`,
        order_id: data.id,
        handler: async function (paymentResponse) {
          alert(`✅ Payment successful! Payment ID: ${paymentResponse.razorpay_payment_id}`);

          try {
            // ✅ Step 3: Verify Payment Status from Backend
            const verifyResponse = await axios.post("https://razorpay-testing-backend.vercel.app/api/verify-payment", {
              paymentId: paymentResponse.razorpay_payment_id,
              orderId: data.id,
              amount: data.amount,
              currency: "INR"
            });

            console.log("Verify Response:", verifyResponse.data);

            if (verifyResponse.data.success) {
              console.log("✅ Payment verified successfully:", verifyResponse.data);
              alert("✅ Payment has been received and verified by the backend!");
            } else {
              console.warn("⚠️ Payment verification failed:", verifyResponse.data);
              alert("⚠️ Payment verification failed. Please contact support.");
            }
          } catch (verifyError) {
            console.error("❌ Error verifying payment:", verifyError);
            alert("⚠️ Error verifying payment. Please try again.");
          }
        },
        prefill: {
          name: "John Doe",
          email: "john.doe@example.com",
          contact: "9999999999",
        },
        notes: { address: "Customer Address" },
        theme: { color: "#F37254" }
      };

      // ✅ Step 4: Initialize Razorpay & Open Payment Window
      const rzp1 = new window.Razorpay(options);

      rzp1.on("payment.failed", function (response) {
        console.error("❌ Payment Failed:", response.error);
        alert(`❌ Payment failed: ${response.error.description}`);
      });

      rzp1.open();

    } catch (error) {
      console.error('❌ Error creating order:', error);
      alert(`⚠️ Error creating order: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [plan.name]: false }));
    }
  };

  const handleSubscriptionPayment = async (plan) => {
    // Don't allow admin to subscribe
    if (isAdmin()) {
      message.info('As an admin, you cannot subscribe to plans.');
      return;
    }

    // Validate plan
    if (!plan || !plan.name) {
      message.error('Invalid plan data');
      return;
    }

    console.log(plan);
    const customerDetails = {
      name: 'Neeraj Suman',
      email: 'neeraj8829sini@gmail.com',
      contact: '9999999999'
    };

    const planId = plan.planId || plan._id;
    if (!planId) {
      message.error('Plan ID is missing. Please contact support.');
      return;
    }

    console.log("printing planId", planId);

    try {
      const response = await axios.post('https://razorpay-testing-backend.vercel.app/api/create-subscription', {
        planId: planId,
        customerDetails: customerDetails,
        totalCount: 12,
        customerId: "cust_QC7ETbBxDPSfZq" // For yearly subscription with monthly payments
      });

      // Store the subscription response
      setApiResponses(prev => ({
        ...prev,
        [`Create Subscription (${plan.name})`]: response.data
      }));

      if (response.data.success && response.data.subscription) {
        const subscription = response.data.subscription;
        console.log("printing subscription", subscription);

        // Check if Razorpay is loaded
        if (!window.Razorpay) {
          message.error('Razorpay SDK failed to load. Please refresh the page and try again.');
          return;
        }

        // Open Razorpay payment for subscription
        const options = {
          key: 'rzp_test_dWLBx9Ob7rYIdJ',
          subscription_id: subscription.id,
          handler: function (paymentResponse) {
            // Handle successful payment
            console.log('Subscription payment successful:', paymentResponse);
            message.success(`Subscription payment successful! Payment ID: ${paymentResponse.razorpay_payment_id}`);

            // Store the payment response
            setApiResponses(prev => ({
              ...prev,
              [`Payment Response (${plan.name})`]: paymentResponse
            }));
          },
          prefill: {
            name: customerDetails.name,
            email: customerDetails.email,
            contact: customerDetails.contact
          },
          theme: {
            color: '#F37254'
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
        message.error(response.data.message || "Failed to create subscription. Please try again.");
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      message.error(error.response?.data?.message || error.message || "Error creating subscription. Please try again.");

      // Store the error response
      setApiResponses(prev => ({
        ...prev,
        [`Subscription Error (${plan.name})`]: {
          error: error.message,
          response: error.response?.data
        }
      }));
    }
  };

  const handlePlanSelection = (plan) => {
    // Don't allow admin to subscribe
    if (isAdmin()) {
      message.info('As an admin, you cannot subscribe to plans.');
      return;
    }

    if (!plan) {
      message.error('Invalid plan selected');
      return;
    }

    setSelectedPlan(plan);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedPlan(null);
  };

  const handleProceedToPayment = () => {
    if (selectedPlan) {
      handleSubscriptionPayment(selectedPlan);
      setShowModal(false);
    }
  };

  const handleClearResponses = (clearAll = false) => {
    if (clearAll) {
      setApiResponses({});
    } else {
      setSidebarOpen(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="plans" element={<Plans />} />
            <Route path="customers" element={<Customers />} />
          </Route>

          {/* User Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ConfigProvider>
  );
}

export default App;

