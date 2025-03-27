import React, { useState } from 'react';
import './App.css';

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
      const response = await fetch('https://razorpay-testing-backend.vercel.app/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receipt: plan.name,
          amount: parseFloat(plan.price.replace('₹', '')) * 100, // Amount in smallest currency unit
          currency: 'INR',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json(); // Assuming the response contains the order ID
      console.log('Order created:', data);

      // Open Razorpay payment window
      const options = {
        //key: "YOUR_RAZORPAY_KEY_ID", // Replace with your actual Razorpay key
        amount: data.amount, // Razorpay requires amount in paise
        currency: "INR",
        name: "Your Company Name",
        description: `Payment for ${plan.name} Plan`,
        order_id: data.id, // Use the correct order ID from backend
        handler: async function (response) {
          alert(`Payment successful! Payment ID: ${response.razorpay_payment_id}`);

          // Capture payment
          await capturePayment(response.razorpay_payment_id, data.amount);
        },
        prefill: {
          name: "Gaurav Kumar",
          email: "gaurav.kumar@example.com",
          contact: "9999999999",
        },
        theme: {
          color: "#F37254"
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open(); // Open the Razorpay payment window
    } catch (error) {
      console.error('Error creating order:', error);
      alert(`Error creating order for ${plan.name}: ${error.message || 'Unknown error'}`);
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
