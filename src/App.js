import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

function App() {
  const [loadingStates, setLoadingStates] = useState({});
  const [plans, setPlans] = useState([]); // Add state for plans
  const [loading, setLoading] = useState(true);

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
        // Ensure we're setting an array of plans
        setPlans(response.data.plans || []); // If the plans are nested in a 'plans' property
        // OR if you need to transform the data:
        // setPlans(Array.isArray(response.data) ? response.data : []);
        console.log(response.data.plans);
      } catch (error) {
        console.error("Error fetching plans:", error);
        alert("Failed to load plans. Please refresh the page.");
        // Set empty array if fetch fails to prevent map error
        setPlans([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);



  // const plans = [
  //   {
  //     name: 'Basic',
  //     planId: 'plan_QBlYx1h4pfIO9r',
  //     price: '₹1',
  //     features: [
  //       'Limited Access',
  //       '1 User',
  //       'Basic Support',
  //       '5GB Storage'
  //     ]
  //   },
  //   {
  //     name: 'Pro',
  //     planId: 'plan_QBlZZmYEihtNxF',
  //     price: '₹2',
  //     features: [
  //       'Full Access',
  //       '5 Users',
  //       'Priority Support',
  //       '50GB Storage',
  //       'Advanced Analytics'
  //     ]
  //   },
  //   {
  //     name: 'Enterprise',
  //     planId: 'plan_QBlZwNbWXDZqpn',
  //     price: '₹3',
  //     features: [
  //       'Unlimited Access',
  //       'Unlimited Users',
  //       '24/7 Dedicated Support',
  //       '1TB Storage',
  //       'Custom Integrations',
  //       'Advanced Security'
  //     ]
  //   }
  // ];

  // const createOrder = async (plan) => {
  //   setLoadingStates((prev) => ({ ...prev, [plan.name]: true })); // Set loading for the specific plan
  //   try {
  //     console.log('Creating order for:', plan); // Log the plan being processed
  //     const response = await axios.post('https://razorpay-testing-backend.vercel.app/api/create-order', {
  //       receipt: plan.name,
  //       amount: parseFloat(plan.price.replace('₹', '')) // Convert price to a number if needed
  //     });
  //     console.log('Order created:', response.data);
  //     // Handle successful order creation (e.g., redirect to payment page)
  //     var options = {
  //       "key_id": "rzp_test_dWLBx9Ob7rYIdJ",
  //       "key_secret": "65ngMLLUKlUggauWummb0G6p",
  //       "amount": response.data.amount,
  //       "currency": "INR",
  //       "name": "Acme Corp",
  //       "description": "A Wild Sheep Chase is the third novel by Japanese author  Haruki Murakami",
  //       "order_id": response.data.id,
  //       handler: function (response) {
  //         alert(response.razorpay_payment_id);
  //       },
  //       "prefill": {
  //         "name": "Neeraj",
  //         "email": "neeraj@gmail.com",
  //         "contact": "9999999999",
  //       },
  //       "notes": {
  //         "address": "note value",
  //       },
  //       "theme": {
  //         "color": "#F37284"
  //       }
  //     };
  //     var rzp1 = new window.Razorpay(options)
  //     rzp1.open();

  //   } catch (error) {
  //     console.error('Error creating order:', error);
  //     console.error('Error response:', error.response); // Log the full error response
  //     alert(`Error creating order for ${plan.name}: ${error.response?.data?.message || error.message || 'Unknown error'}`);
  //   } finally {
  //     setLoadingStates((prev) => ({ ...prev, [plan.name]: false })); // Reset loading for the specific plan
  //   }
  // };


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
      name: 'Neeraj',
      email: 'neeraj8829sini@gmail.com',
      contact: '9999999999'
    };

    const planId = plan.planId;
    console.log("printing planId", planId);

    try {
      const response = await axios.post('https://razorpay-testing-backend.vercel.app/api/create-subscription', {
        planId: planId,
        customerDetails: customerDetails,
        totalCount: 12 // For yearly subscription with monthly payments
      });

      if (response.data.success) {
        const subscription = response.data.subscription;

        // Open Razorpay payment for subscription
        const options = {
          key: 'YOUR_RAZORPAY_KEY_ID',
          subscription_id: subscription.id,
          handler: function (response) {
            // Handle successful payment
            console.log('Subscription payment successful:', response);
            // Verify payment on your backend
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
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
    }
  };


  if (loading) {
    return <div>Loading plans...</div>;
  }

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
                onClick={() => handleSubscriptionPayment(plan)}
                disabled={loadingStates[plan.name]}
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
