import React from 'react';

const Sidebar = () => {
  return (
    <aside style={{ width: '250px', backgroundColor: '#f5f5f5', padding: '20px', height: '100vh', display: 'none' }}>
      <h3>Resources</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li style={{ padding: '10px 0', borderBottom: '1px solid #ddd' }}>Crop Guides</li>
        <li style={{ padding: '10px 0', borderBottom: '1px solid #ddd' }}>Weather Alerts</li>
        <li style={{ padding: '10px 0', borderBottom: '1px solid #ddd' }}>Govt Schemes</li>
      </ul>
    </aside>
  );
};

export default Sidebar;