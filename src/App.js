import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';
import SubscriptionModal from './components/SubscriptionModal';
import ResponseSidebar from './components/ResponseSidebar';

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
    return () => {
      document.body.removeChild(script);
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
        alert("Failed to load plans. Please refresh the page.");
        setPlans([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const createOrder = async (plan) => {
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
    console.log(plan);
    const customerDetails = {
      name: 'Neeraj Suman',
      email: 'neeraj8829sini@gmail.com',
      contact: '9999999999'
    };

    const planId = plan.planId;
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

      if (response.data.success) {
        const subscription = response.data.subscription;
        console.log("printing subscription", subscription);

        // Open Razorpay payment for subscription
        const options = {
          key: 'rzp_test_dWLBx9Ob7rYIdJ',
          subscription_id: subscription.id,
          handler: function (paymentResponse) {
            // Handle successful payment
            console.log('Subscription payment successful:', paymentResponse);
            alert(`Subscription payment successful! Payment ID: ${paymentResponse.razorpay_payment_id}`);

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
          }
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
      } else {
        alert("Failed to create subscription. Please try again.");
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      alert("Error creating subscription. Please try again.");

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

  if (loading) {
    return <div>Loading plans...</div>;
  }

  return (
    <div className="container">
      <button
        className="toggle-sidebar-button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? "Hide Responses" : "Show Responses"}
      </button>

      <h1 className="title">Choose Your Plan</h1>
      <div className="plans">
        {plans.map((plan) => (
          <div key={plan.name} className="card">
            <div className="card-header">
              <h2 className="card-title">{plan.name}</h2>
              <p className="card-price">{plan.price}/mo</p>
            </div>
            <div className="card-content">
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature} className="feature">
                    ✓ {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card-footer">
              <button
                className="buy-button"
                onClick={() => handlePlanSelection(plan)}
                disabled={loadingStates[plan.name]}
              >
                {loadingStates[plan.name] ? 'Processing...' : 'Buy Now'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && selectedPlan && (
        <SubscriptionModal
          plan={selectedPlan}
          onClose={handleModalClose}
          onProceed={handleProceedToPayment}
          customerDetails={{
            name: 'Neeraj Suman',
            email: 'neeraj8829sini@gmail.com',
            contact: '9999999999'
          }}
        />
      )}

      <ResponseSidebar
        isOpen={sidebarOpen}
        responses={apiResponses}
        onClose={handleClearResponses}
      />
    </div>
  );
}

export default App;

