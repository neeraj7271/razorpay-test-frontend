import React from 'react';
import './App.css';

function App() {
  const plans = [
    {
      name: 'Basic',
      price: '₹799',
      features: [
        'Limited Access',
        '1 User',
        'Basic Support',
        '5GB Storage'
      ]
    },
    {
      name: 'Pro',
      price: '₹1599',
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
      price: '₹3999',
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
              <button className="buy-button">Buy Now</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
