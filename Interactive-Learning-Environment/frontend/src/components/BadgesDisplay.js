import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/apiClient';
import '../styles/Badges.css';

const BadgesDisplay = ({ studentId }) => {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const response = await apiClient.get(`/badges/student/${studentId}`);
        setBadges(response.data);
      } catch (err) {
        console.error('Failed to load badges:', err);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchBadges();
    }
  }, [studentId]);

  if (loading) return <div>Loading badges...</div>;

  return (
    <div className="badges-container">
      <h2>Your Achievements</h2>
      {badges.length === 0 ? (
        <p className="empty-state">
          Complete challenges to earn badges and achievements!
        </p>
      ) : (
        <div className="badges-grid">
          {badges.map((badge, index) => (
            <div key={index} className="badge-card">
              <div className="badge-icon">🏆</div>
              <div className="badge-info">
                <h3>{badge.name}</h3>
                <p>{badge.description}</p>
                <span className="badge-date">
                  Earned: {new Date(badge.earnedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BadgesDisplay;
