import React, { useState } from 'react';
import './App.css';
import axios from 'axios';

function App() {
  const [loadingStates, setLoadingStates] = useState({}); // Object to manage loading states for each plan

  const plans = [
    {
      name: 'Basic',
      price: '₹1',
      features: [
        'Limited Access',
        '1 User',
        'Basic Support',
        '5GB Storage'
      ]
    },
    {
      name: 'Pro',
      price: '₹2',
      features: [
        'Full Access',
        '5 Users',
        'Priority Support',
        '50GB Storage',
        'Advanced Analytics'
      ]
    },
    {
      name: 'Enterprise',
      price: '₹3',
      features: [
        'Unlimited Access',
        'Unlimited Users',
        '24/7 Dedicated Support',
        '1TB Storage',
        'Custom Integrations',
        'Advanced Security'
      ]
    }
  ];

  const createOrder = async (plan) => {
    setLoadingStates((prev) => ({ ...prev, [plan.name]: true })); // Set loading for the specific plan
    try {
      console.log('Creating order for:', plan); // Log the plan being processed
      const response = await axios.post('https://razorpay-testing-backend.vercel.app/api/create-order', {
        receipt: plan.name,
        amount: parseFloat(plan.price.replace('₹', '')) // Convert price to a number if needed
      });
      console.log('Order created:', response.data);
      // Handle successful order creation (e.g., redirect to payment page)

      const options = {
        key: process.env.RAZORPAY_KEY_ID, // Replace with actual Razorpay Key
        amount: data.amount, // Amount in paise
        currency: "INR",
        name: "Neeraj Suman",
        description: `Payment for ${plan.name} Plan`,
        order_id: data.id, // Use the order ID received from backend
        handler: async function (response) {
          alert(`Payment successful! Payment ID: ${response.razorpay_payment_id}`);

          // Step 3: Capture the payment on the backend
          await capturePayment(response.razorpay_payment_id, data.amount);
        },
        prefill: {
          name: "John Doe",
          email: "john.doe@example.com",
          contact: "9999999999",
        },
        notes: {
          address: "Customer Address",
        },
        theme: {
          color: "#F37254"
        }
      };

      const rzp1 = new Razorpay(options);
      rzp1.open(); // 🚀 Automatically open the payment window



    } catch (error) {
      console.error('Error creating order:', error);
      console.error('Error response:', error.response); // Log the full error response
      alert(`Error creating order for ${plan.name}: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [plan.name]: false })); // Reset loading for the specific plan
    }
  };

  return (
    <div className="container">
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
                onClick={() => createOrder(plan)}
                disabled={loadingStates[plan.name]} // Disable button based on individual loading state
              >
                {loadingStates[plan.name] ? 'Processing...' : 'Buy Now'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
