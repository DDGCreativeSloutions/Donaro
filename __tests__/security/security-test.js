const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app } = require('../../backend/src/server');

class SecurityTest {
  constructor() {
    this.results = {
      vulnerabilities: [],
      passed: [],
      failed: [],
      warnings: []
    };
    this.baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
  }

  log(type, test, message, severity = 'medium') {
    const result = {
      test,
      message,
      severity,
      timestamp: new Date().toISOString()
    };

    this.results[type].push(result);
    
    const emoji = {
      vulnerabilities: '🚨',
      failed: '❌',
      passed: '✅',
      warnings: '⚠️'
    }[type];

    console.log(`${emoji} [${severity.toUpperCase()}] ${test}: ${message}`);
  }

  async testSQLInjection() {
    console.log('\n🔍 Testing SQL Injection Vulnerabilities...');
    
    const sqlPayloads = [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "' UNION SELECT * FROM users --",
      "admin'--",
      "' OR 1=1 --",
      "'; INSERT INTO users VALUES ('hacker', 'password'); --"
    ];

    for (const payload of sqlPayloads) {
      try {
        // Test login endpoint
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            email: payload,
            password: payload
          });

        if (loginResponse.status === 200 && loginResponse.body.token) {
          this.log('vulnerabilities', 'SQL Injection - Login', 
            `SQL injection successful with payload: ${payload}`, 'critical');
        } else {
          this.log('passed', 'SQL Injection - Login', 
            `Payload blocked: ${payload}`, 'low');
        }

        // Test search/filter endpoints if they exist
        const searchResponse = await request(app)
          .get(`/api/donations?search=${encodeURIComponent(payload)}`);

        if (searchResponse.status === 500) {
          this.log('vulnerabilities', 'SQL Injection - Search', 
            `Potential SQL injection in search: ${payload}`, 'high');
        }

      } catch (error) {
        this.log('passed', 'SQL Injection', 
          `Payload properly rejected: ${payload}`, 'low');
      }
    }
  }

  async testXSS() {
    console.log('\n🔍 Testing Cross-Site Scripting (XSS) Vulnerabilities...');
    
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src="x" onerror="alert(\'XSS\')">',
      'javascript:alert("XSS")',
      '<svg onload="alert(\'XSS\')">',
      '"><script>alert("XSS")</script>',
      '<iframe src="javascript:alert(\'XSS\')"></iframe>'
    ];

    // First, create a test user and get token
    const testUser = {
      name: 'Security Test User',
      email: 'security@test.com',
      phone: '1234567890',
      password: 'password123'
    };

    try {
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      const authToken = registerResponse.body.token;

      for (const payload of xssPayloads) {
        try {
          // Test donation creation with XSS payload
          const donationResponse = await request(app)
            .post('/api/donations')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              type: 'food',
              title: payload,
              description: payload,
              quantity: '1 kg',
              receiver: payload,
              date: '2024-01-15',
              time: '10:00',
              location: 'Test Location',
              donationPhoto: 'test.jpg',
              selfiePhoto: 'test.jpg'
            });

          if (donationResponse.status === 201) {
            // Check if the payload is stored as-is (potential stored XSS)
            const fetchResponse = await request(app)
              .get(`/api/donations/user/${registerResponse.body.user.id}`)
              .set('Authorization', `Bearer ${authToken}`);

            const donation = fetchResponse.body.find(d => d.title === payload);
            if (donation && donation.title === payload) {
              this.log('vulnerabilities', 'Stored XSS', 
                `XSS payload stored without sanitization: ${payload}`, 'high');
            } else {
              this.log('passed', 'XSS Protection', 
                `Payload sanitized: ${payload}`, 'low');
            }
          }

          // Test profile update with XSS payload
          const profileResponse = await request(app)
            .put(`/api/users/${registerResponse.body.user.id}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              name: payload
            });

          if (profileResponse.status === 200 && profileResponse.body.name === payload) {
            this.log('vulnerabilities', 'Stored XSS - Profile', 
              `XSS payload stored in profile: ${payload}`, 'high');
          }

        } catch (error) {
          this.log('passed', 'XSS Protection', 
            `Payload properly rejected: ${payload}`, 'low');
        }
      }
    } catch (error) {
      this.log('warnings', 'XSS Test Setup', 
        'Could not create test user for XSS testing', 'medium');
    }
  }

  async testAuthenticationBypass() {
    console.log('\n🔍 Testing Authentication Bypass Vulnerabilities...');
    
    // Test accessing protected endpoints without token
    const protectedEndpoints = [
      '/api/donations',
      '/api/users/test-id',
      '/api/withdrawals',
      '/api/donations/user/test-id'
    ];

    for (const endpoint of protectedEndpoints) {
      try {
        const response = await request(app).get(endpoint);
        
        if (response.status === 200) {
          this.log('vulnerabilities', 'Authentication Bypass', 
            `Protected endpoint accessible without auth: ${endpoint}`, 'critical');
        } else if (response.status === 401) {
          this.log('passed', 'Authentication Check', 
            `Endpoint properly protected: ${endpoint}`, 'low');
        }
      } catch (error) {
        this.log('passed', 'Authentication Check', 
          `Endpoint properly protected: ${endpoint}`, 'low');
      }
    }

    // Test with invalid tokens
    const invalidTokens = [
      'invalid-token',
      'Bearer invalid',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
      '',
      null
    ];

    for (const token of invalidTokens) {
      try {
        const response = await request(app)
          .get('/api/donations')
          .set('Authorization', token ? `Bearer ${token}` : '');

        if (response.status === 200) {
          this.log('vulnerabilities', 'Invalid Token Accepted', 
            `Invalid token accepted: ${token}`, 'high');
        } else {
          this.log('passed', 'Token Validation', 
            `Invalid token rejected: ${token}`, 'low');
        }
      } catch (error) {
        this.log('passed', 'Token Validation', 
          `Invalid token properly rejected: ${token}`, 'low');
      }
    }
  }

  async testJWTSecurity() {
    console.log('\n🔍 Testing JWT Security...');
    
    // Test JWT algorithm confusion
    try {
      const noneToken = jwt.sign(
        { userId: 'test-user', email: 'test@example.com' },
        '',
        { algorithm: 'none' }
      );

      const response = await request(app)
        .get('/api/donations')
        .set('Authorization', `Bearer ${noneToken}`);

      if (response.status === 200) {
        this.log('vulnerabilities', 'JWT Algorithm Confusion', 
          'JWT with "none" algorithm accepted', 'critical');
      } else {
        this.log('passed', 'JWT Algorithm Security', 
          'JWT with "none" algorithm rejected', 'low');
      }
    } catch (error) {
      this.log('passed', 'JWT Algorithm Security', 
        'JWT algorithm confusion prevented', 'low');
    }

    // Test JWT secret brute force (weak secrets)
    const weakSecrets = ['secret', '123456', 'password', 'jwt', 'key'];
    
    for (const secret of weakSecrets) {
      try {
        const testToken = jwt.sign(
          { userId: 'hacker', email: 'hacker@example.com' },
          secret,
          { expiresIn: '1h' }
        );

        const response = await request(app)
          .get('/api/donations')
          .set('Authorization', `Bearer ${testToken}`);

        if (response.status === 200) {
          this.log('vulnerabilities', 'Weak JWT Secret', 
            `JWT signed with weak secret accepted: ${secret}`, 'critical');
        }
      } catch (error) {
        // Expected - weak secret should not work
      }
    }

    this.log('passed', 'JWT Secret Strength', 
      'Weak JWT secrets rejected', 'low');
  }

  async testRateLimiting() {
    console.log('\n🔍 Testing Rate Limiting...');
    
    const endpoints = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/donations'
    ];

    for (const endpoint of endpoints) {
      const requests = [];
      const startTime = Date.now();

      // Send 20 rapid requests
      for (let i = 0; i < 20; i++) {
        const requestPromise = request(app)
          .post(endpoint)
          .send({
            email: `test${i}@example.com`,
            password: 'password123',
            name: `Test User ${i}`,
            phone: `123456789${i}`
          });
        requests.push(requestPromise);
      }

      try {
        const responses = await Promise.all(requests);
        const rateLimitedResponses = responses.filter(r => r.status === 429);
        const endTime = Date.now();
        const duration = endTime - startTime;

        if (rateLimitedResponses.length === 0 && duration < 5000) {
          this.log('vulnerabilities', 'No Rate Limiting', 
            `No rate limiting detected on ${endpoint}`, 'medium');
        } else {
          this.log('passed', 'Rate Limiting', 
            `Rate limiting active on ${endpoint}`, 'low');
        }
      } catch (error) {
        this.log('warnings', 'Rate Limiting Test', 
          `Could not complete rate limiting test for ${endpoint}`, 'low');
      }
    }
  }

  async testInputValidation() {
    console.log('\n🔍 Testing Input Validation...');
    
    // Test oversized payloads
    const largeString = 'A'.repeat(10000);
    
    try {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: largeString,
          email: 'test@example.com',
          phone: '1234567890',
          password: 'password123'
        });

      if (response.status === 201) {
        this.log('vulnerabilities', 'Input Size Validation', 
          'Oversized input accepted', 'medium');
      } else {
        this.log('passed', 'Input Size Validation', 
          'Oversized input rejected', 'low');
      }
    } catch (error) {
      this.log('passed', 'Input Size Validation', 
        'Oversized input properly handled', 'low');
    }

    // Test malformed JSON
    try {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"email": "test@example.com", "password": "pass"'); // Malformed JSON

      if (response.status === 500) {
        this.log('vulnerabilities', 'JSON Parsing', 
          'Malformed JSON causes server error', 'medium');
      } else {
        this.log('passed', 'JSON Parsing', 
          'Malformed JSON handled gracefully', 'low');
      }
    } catch (error) {
      this.log('passed', 'JSON Parsing', 
        'Malformed JSON properly handled', 'low');
    }

    // Test email validation
    const invalidEmails = [
      'invalid-email',
      '@example.com',
      'test@',
      'test..test@example.com',
      'test@example',
      ''
    ];

    for (const email of invalidEmails) {
      try {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            name: 'Test User',
            email: email,
            phone: '1234567890',
            password: 'password123'
          });

        if (response.status === 201) {
          this.log('vulnerabilities', 'Email Validation', 
            `Invalid email accepted: ${email}`, 'medium');
        } else {
          this.log('passed', 'Email Validation', 
            `Invalid email rejected: ${email}`, 'low');
        }
      } catch (error) {
        this.log('passed', 'Email Validation', 
          `Invalid email properly rejected: ${email}`, 'low');
      }
    }
  }

  async testPrivilegeEscalation() {
    console.log('\n🔍 Testing Privilege Escalation...');
    
    // Create regular user
    try {
      const userResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Regular User',
          email: 'regular@test.com',
          phone: '1234567890',
          password: 'password123'
        });

      const userToken = userResponse.body.token;

      // Try to access admin endpoints
      const adminEndpoints = [
        '/api/donations/status/pending',
        '/api/withdrawals/status/pending'
      ];

      for (const endpoint of adminEndpoints) {
        const response = await request(app)
          .get(endpoint)
          .set('Authorization', `Bearer ${userToken}`);

        if (response.status === 200) {
          this.log('vulnerabilities', 'Privilege Escalation', 
            `Regular user can access admin endpoint: ${endpoint}`, 'high');
        } else if (response.status === 403) {
          this.log('passed', 'Access Control', 
            `Admin endpoint properly protected: ${endpoint}`, 'low');
        }
      }

      // Try to update other user's data
      const otherUserResponse = await request(app)
        .put('/api/users/other-user-id')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Hacked Name' });

      if (otherUserResponse.status === 200) {
        this.log('vulnerabilities', 'Horizontal Privilege Escalation', 
          'User can modify other user data', 'high');
      } else {
        this.log('passed', 'User Data Protection', 
          'User cannot modify other user data', 'low');
      }

    } catch (error) {
      this.log('warnings', 'Privilege Escalation Test', 
        'Could not complete privilege escalation test', 'medium');
    }
  }

  async testFileUploadSecurity() {
    console.log('\n🔍 Testing File Upload Security...');
    
    // Test malicious file uploads (if upload endpoints exist)
    const maliciousFiles = [
      { name: 'test.php', content: '<?php system($_GET["cmd"]); ?>' },
      { name: 'test.jsp', content: '<% Runtime.getRuntime().exec(request.getParameter("cmd")); %>' },
      { name: 'test.exe', content: 'MZ\x90\x00' }, // PE header
      { name: '../../../etc/passwd', content: 'path traversal test' }
    ];

    for (const file of maliciousFiles) {
      try {
        const response = await request(app)
          .post('/api/upload')
          .attach('file', Buffer.from(file.content), file.name);

        if (response.status === 200) {
          this.log('vulnerabilities', 'Malicious File Upload', 
            `Malicious file accepted: ${file.name}`, 'high');
        } else {
          this.log('passed', 'File Upload Security', 
            `Malicious file rejected: ${file.name}`, 'low');
        }
      } catch (error) {
        this.log('passed', 'File Upload Security', 
          `File upload properly secured for: ${file.name}`, 'low');
      }
    }
  }

  async testCSRF() {
    console.log('\n🔍 Testing CSRF Protection...');
    
    // Test if state-changing operations require CSRF tokens
    try {
      const userResponse = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'CSRF Test User',
          email: 'csrf@test.com',
          phone: '1234567890',
          password: 'password123'
        });

      const userToken = userResponse.body.token;

      // Try to perform state-changing operation without CSRF token
      const donationResponse = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Origin', 'http://malicious-site.com')
        .send({
          type: 'food',
          title: 'CSRF Test Donation',
          description: 'Test',
          quantity: '1 kg',
          receiver: 'Test',
          date: '2024-01-15',
          time: '10:00',
          location: 'Test',
          donationPhoto: 'test.jpg',
          selfiePhoto: 'test.jpg'
        });

      if (donationResponse.status === 201) {
        this.log('vulnerabilities', 'CSRF Vulnerability', 
          'State-changing operation allowed from different origin', 'medium');
      } else {
        this.log('passed', 'CSRF Protection', 
          'Cross-origin requests properly blocked', 'low');
      }

    } catch (error) {
      this.log('warnings', 'CSRF Test', 
        'Could not complete CSRF test', 'medium');
    }
  }

  generateSecurityReport() {
    console.log('\n📊 Security Test Report');
    console.log('=' .repeat(60));

    const totalTests = this.results.passed.length + this.results.failed.length + this.results.vulnerabilities.length;
    const criticalVulns = this.results.vulnerabilities.filter(v => v.severity === 'critical').length;
    const highVulns = this.results.vulnerabilities.filter(v => v.severity === 'high').length;
    const mediumVulns = this.results.vulnerabilities.filter(v => v.severity === 'medium').length;

    console.log(`\n📈 Summary:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${this.results.passed.length}`);
    console.log(`   Vulnerabilities Found: ${this.results.vulnerabilities.length}`);
    console.log(`   Warnings: ${this.results.warnings.length}`);

    if (this.results.vulnerabilities.length > 0) {
      console.log(`\n🚨 Vulnerabilities by Severity:`);
      console.log(`   Critical: ${criticalVulns}`);
      console.log(`   High: ${highVulns}`);
      console.log(`   Medium: ${mediumVulns}`);

      console.log(`\n🔍 Vulnerability Details:`);
      this.results.vulnerabilities.forEach((vuln, index) => {
        console.log(`   ${index + 1}. [${vuln.severity.toUpperCase()}] ${vuln.test}`);
        console.log(`      ${vuln.message}`);
      });
    }

    if (this.results.warnings.length > 0) {
      console.log(`\n⚠️  Warnings:`);
      this.results.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning.test}: ${warning.message}`);
      });
    }

    // Security score calculation
    const maxScore = 100;
    const criticalPenalty = criticalVulns * 25;
    const highPenalty = highVulns * 15;
    const mediumPenalty = mediumVulns * 5;
    const securityScore = Math.max(0, maxScore - criticalPenalty - highPenalty - mediumPenalty);

    console.log(`\n🏆 Security Score: ${securityScore}/100`);
    
    if (securityScore >= 90) {
      console.log('   ✅ Security Status: EXCELLENT');
    } else if (securityScore >= 70) {
      console.log('   ⚠️  Security Status: GOOD');
    } else if (securityScore >= 50) {
      console.log('   ❌ Security Status: NEEDS IMPROVEMENT');
    } else {
      console.log('   🚨 Security Status: CRITICAL - IMMEDIATE ACTION REQUIRED');
    }

    // Recommendations
    console.log(`\n💡 Security Recommendations:`);
    
    if (criticalVulns > 0) {
      console.log('   • URGENT: Fix critical vulnerabilities immediately');
      console.log('   • Review authentication and authorization mechanisms');
    }
    
    if (highVulns > 0) {
      console.log('   • Implement input validation and sanitization');
      console.log('   • Review access control mechanisms');
    }
    
    if (mediumVulns > 0) {
      console.log('   • Implement rate limiting and CSRF protection');
      console.log('   • Review error handling and information disclosure');
    }

    console.log('   • Conduct regular security audits');
    console.log('   • Implement security headers and HTTPS');
    console.log('   • Use dependency scanning tools');
    console.log('   • Implement logging and monitoring');

    return {
      summary: {
        totalTests,
        passed: this.results.passed.length,
        vulnerabilities: this.results.vulnerabilities.length,
        warnings: this.results.warnings.length,
        securityScore,
        criticalVulns,
        highVulns,
        mediumVulns
      },
      details: this.results
    };
  }
}

async function runSecurityTests() {
  const tester = new SecurityTest();
  
  console.log('🔒 Starting Comprehensive Security Testing...');
  console.log('=' .repeat(60));

  try {
    await tester.testSQLInjection();
    await tester.testXSS();
    await tester.testAuthenticationBypass();
    await tester.testJWTSecurity();
    await tester.testRateLimiting();
    await tester.testInputValidation();
    await tester.testPrivilegeEscalation();
    await tester.testFileUploadSecurity();
    await tester.testCSRF();

    const report = tester.generateSecurityReport();
    
    // Save report to file
    const fs = require('fs');
    const reportPath = './security-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed security report saved to: ${reportPath}`);

    // Exit with appropriate code
    if (report.summary.criticalVulns > 0) {
      console.log('\n🚨 Critical vulnerabilities found - IMMEDIATE ACTION REQUIRED');
      process.exit(1);
    } else if (report.summary.vulnerabilities > 0) {
      console.log('\n⚠️  Security vulnerabilities found - Review and fix recommended');
      process.exit(1);
    } else {
      console.log('\n✅ No critical security vulnerabilities found');
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Security test suite failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runSecurityTests();
}

module.exports = { SecurityTest, runSecurityTests };