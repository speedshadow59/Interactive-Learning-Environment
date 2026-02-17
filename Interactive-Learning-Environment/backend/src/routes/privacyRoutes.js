/**
 * GDPR Compliance Routes
 * Handles user data export, deletion, and privacy preferences
 * 
 * Endpoints:
 * - GET /api/privacy/profile - Get user data
 * - POST /api/privacy/export - Export user data as JSON
 * - DELETE /api/privacy/account - Request account deletion
 * - POST /api/privacy/consent - Update privacy consent
 * - GET /api/privacy/policy - Get privacy policy
 */

const router = require('express').Router();
const User = require('../models/User');
const { authenticate } = require('../middleware/authMiddleware');
const { asyncHandler, AppError } = require('../middleware/errorHandler');

/**
 * GET /api/privacy/profile
 * Get user's currently stored data
 */
router.get(
  '/profile',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate([
      'enrolledCourses',
      'teachingCourses',
    ]);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: {
        personalData: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
        },
        enrollments: user.enrolledCourses,
        teachingCourses: user.teachingCourses,
        points: user.points,
        badges: user.badges,
      },
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * POST /api/privacy/export
 * Export all user data as a downloadable JSON file
 */
router.post(
  '/export',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
      .populate('enrolledCourses')
      .populate('teachingCourses')
      .populate('badges');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        points: user.points,
      },
      enrolledCourses: user.enrolledCourses,
      teachingCourses: user.teachingCourses,
      badges: user.badges.map((badge) => ({
        name: badge.name,
        description: badge.description,
        earnedAt: badge.earnedAt,
      })),
      privacyConsent: {
        marketingEmails: user.privacyConsent?.marketingEmails || false,
        analyticsTracking: user.privacyConsent?.analyticsTracking || false,
        thirdPartySharing: user.privacyConsent?.thirdPartySharing || false,
        consentUpdateDate: user.privacyConsent?.updatedAt || user.createdAt,
      },
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="user-data-${user._id}-${Date.now()}.json"`
    );
    res.json(exportData);
  })
);

/**
 * POST /api/privacy/delete-request
 * Request account deletion (with 30-day grace period)
 * GDPR Right to be Forgotten (Article 17)
 */
router.post(
  '/delete-request',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Mark account for deletion with grace period
    user.deletionScheduled = {
      requestedAt: new Date(),
      deleteAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      gracePeriodDays: 30,
    };

    user.isActive = false; // Disable account immediately

    await user.save();

    res.json({
      success: true,
      message:
        'Your account has been scheduled for deletion. You have 30 days to cancel this request.',
      deletionDate: user.deletionScheduled.deleteAt,
      cancellationWindow: '30 days',
      cancelUrl: '/api/privacy/cancel-deletion',
    });
  })
);

/**
 * POST /api/privacy/cancel-deletion
 * Cancel a pending account deletion request
 */
router.post(
  '/cancel-deletion',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.deletionScheduled) {
      throw new AppError('No deletion request in progress', 400);
    }

    user.deletionScheduled = null;
    user.isActive = true;

    await user.save();

    res.json({
      success: true,
      message: 'Account deletion has been cancelled. Your account is now active.',
    });
  })
);

/**
 * POST /api/privacy/consent
 * Update user privacy consent preferences
 * GDPR Lawful Basis: Consent (Article 6(1)(a))
 */
router.post(
  '/consent',
  authenticate,
  asyncHandler(async (req, res) => {
    const { marketingEmails, analyticsTracking, thirdPartySharing } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.privacyConsent = {
      marketingEmails: Boolean(marketingEmails),
      analyticsTracking: Boolean(analyticsTracking),
      thirdPartySharing: Boolean(thirdPartySharing),
      updatedAt: new Date(),
    };

    // Log consent change for audit trail
    console.log(
      `[GDPR AUDIT] User ${user._id} updated privacy consent: ${JSON.stringify(user.privacyConsent)}`
    );

    await user.save();

    res.json({
      success: true,
      message: 'Privacy preferences updated successfully',
      consent: user.privacyConsent,
    });
  })
);

/**
 * GET /api/privacy/policy
 * Retrieve privacy policy document
 */
router.get('/policy', (req, res) => {
  const privacyPolicy = {
    version: '1.0',
    lastUpdated: '2025-01-15',
    effectiveDate: '2025-01-15',
    organization: 'Interactive Learning Environment',
    contact: {
      email: 'privacy@learning-platform.local',
      website: 'learning-platform.local',
    },

    sections: {
      introduction: {
        title: 'Introduction',
        content:
          'This Privacy Policy explains how we collect, use, disclose, and safeguard your information.',
      },

      dataCollection: {
        title: 'Data We Collect',
        categories: [
          'Account Information: email, name, role, password hash',
          'Educational Data: courses enrolled, challenges submitted, test results',
          'Usage Data: login timestamps, feature interaction logs',
          'Device Data: IP address, browser type (optional analytics)',
        ],
      },

      lawfulBasis: {
        title: 'Lawful Basis for Processing (GDPR Article 6)',
        bases: [
          'Contract: Processing necessary to provide educational services',
          'Consent: Optional analytics and marketing communications',
          'Legitimate Interest: Platform security and improvement',
          'Legal Obligation: Data retention for educational records',
        ],
      },

      dataUsage: {
        title: 'How We Use Your Data',
        purposes: [
          'Provide educational platform functionality',
          'Track progress and generate performance reports',
          'Improve platform usability and features',
          'Send administrative notifications',
          'Comply with educational standards',
        ],
      },

      dataRetention: {
        title: 'Data Retention',
        policy: {
          activeAccounts: 'Retained while account is active',
          deletedAccounts:
            'Deleted within 30 days of deletion request (Article 17)',
          educationalRecords: 'Retained for 7 years per school retention policy',
          logs: 'Retained for 90 days for security purposes',
        },
      },

      userRights: {
        title: 'Your GDPR Rights',
        rights: [
          'Right of Access (Article 15): Request copy of your data',
          'Right to Rectification (Article 16): Correct inaccurate data',
          'Right to Erasure (Article 17): Request data deletion (Right to be Forgotten)',
          'Right to Data Portability (Article 20): Download data in machine-readable format',
          'Right to Object (Article 21): Opt-out of non-essential processing',
          'Right to Complaint: File complaint with supervisory authority',
        ],
      },

      securityMeasures: {
        title: 'Security Measures',
        measures: [
          'Password hashing with bcryptjs (OWASP standard)',
          'JWT-based authentication with secure tokens',
          'HTTPS encryption for all data transmission',
          'CORS security headers and input sanitization',
          'Rate limiting to prevent brute force attacks',
          'Regular security audits and updates',
        ],
      },

      thirdParties: {
        title: 'Third-Party Sharing',
        policy:
          'We do not sell or share personal data with third parties without explicit consent. Data is not shared except as required by law.',
      },

      children: {
        title: 'Children Under 13',
        policy:
          'This platform is designed for students ages 13+. We obtain parental consent for children under 13.',
      },

      changes: {
        title: 'Changes to This Policy',
        policy:
          'We may update this policy periodically. Users will be notified of significant changes via email or platform notification.',
      },

      contact: {
        title: 'Contact Information',
        dataProtectionOfficer: 'privacy@learning-platform.local',
        supervisor: 'Data Protection Authority of your jurisdiction',
      },
    },
  };

  res.json(privacyPolicy);
});

module.exports = router;
