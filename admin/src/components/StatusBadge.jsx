import React from 'react';

const StatusBadge = ({ status }) => {
  if (!status) return null;
  const display = status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return (
    <span className={`badge badge-${status}`}>
      <span className="badge-dot"></span>
      {display}
    </span>
  );
};

export default StatusBadge;
