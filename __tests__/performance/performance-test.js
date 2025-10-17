const puppeteer = require('puppeteer');
const { performance } = require('perf_hooks');

class PerformanceTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      loadTimes: [],
      renderTimes: [],
      memoryUsage: [],
      networkRequests: [],
      errors: []
    };
  }

  async setup() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // Enable performance monitoring
    await this.page.setCacheEnabled(false);
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Monitor network requests
    this.page.on('response', (response) => {
      this.results.networkRequests.push({
        url: response.url(),
        status: response.status(),
        loadTime: response.timing()?.receiveHeadersEnd || 0
      });
    });

    // Monitor console errors
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        this.results.errors.push(msg.text());
      }
    });
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async measurePageLoad(url, testName) {
    console.log(`\n🔍 Testing ${testName}...`);
    
    const startTime = performance.now();
    
    try {
      // Navigate to page and wait for network idle
      await this.page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      const loadTime = performance.now() - startTime;
      
      // Measure First Contentful Paint
      const fcp = await this.page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.name === 'first-contentful-paint') {
                resolve(entry.startTime);
              }
            }
          }).observe({ entryTypes: ['paint'] });
          
          // Fallback timeout
          setTimeout(() => resolve(null), 5000);
        });
      });

      // Measure Largest Contentful Paint
      const lcp = await this.page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            resolve(lastEntry.startTime);
          }).observe({ entryTypes: ['largest-contentful-paint'] });
          
          // Fallback timeout
          setTimeout(() => resolve(null), 5000);
        });
      });

      // Measure memory usage
      const memoryUsage = await this.page.evaluate(() => {
        return performance.memory ? {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        } : null;
      });

      const result = {
        testName,
        url,
        loadTime: Math.round(loadTime),
        fcp: fcp ? Math.round(fcp) : null,
        lcp: lcp ? Math.round(lcp) : null,
        memoryUsage,
        timestamp: new Date().toISOString()
      };

      this.results.loadTimes.push(result);
      
      console.log(`✅ ${testName}:`);
      console.log(`   Load Time: ${result.loadTime}ms`);
      console.log(`   First Contentful Paint: ${result.fcp || 'N/A'}ms`);
      console.log(`   Largest Contentful Paint: ${result.lcp || 'N/A'}ms`);
      if (memoryUsage) {
        console.log(`   Memory Usage: ${Math.round(memoryUsage.usedJSHeapSize / 1024 / 1024)}MB`);
      }

      return result;
    } catch (error) {
      console.error(`❌ ${testName} failed:`, error.message);
      this.results.errors.push(`${testName}: ${error.message}`);
      return null;
    }
  }

  async measureInteraction(selector, actionType, testName) {
    console.log(`\n🖱️  Testing ${testName}...`);
    
    try {
      const startTime = performance.now();
      
      switch (actionType) {
        case 'click':
          await this.page.click(selector);
          break;
        case 'type':
          await this.page.type(selector, 'test input');
          break;
        case 'scroll':
          await this.page.evaluate((sel) => {
            document.querySelector(sel)?.scrollIntoView();
          }, selector);
          break;
      }
      
      // Wait for any resulting network activity to settle
      await this.page.waitForTimeout(1000);
      
      const interactionTime = performance.now() - startTime;
      
      const result = {
        testName,
        actionType,
        selector,
        interactionTime: Math.round(interactionTime),
        timestamp: new Date().toISOString()
      };

      this.results.renderTimes.push(result);
      
      console.log(`✅ ${testName}: ${result.interactionTime}ms`);
      
      return result;
    } catch (error) {
      console.error(`❌ ${testName} failed:`, error.message);
      this.results.errors.push(`${testName}: ${error.message}`);
      return null;
    }
  }

  async runMobilePerformanceTest() {
    console.log('\n📱 Running Mobile Performance Tests...');
    
    // Simulate mobile device
    await this.page.emulate({
      name: 'iPhone 12',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      viewport: {
        width: 390,
        height: 844,
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        isLandscape: false
      }
    });

    // Simulate slow 3G network
    await this.page.emulateNetworkConditions({
      offline: false,
      downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
      uploadThroughput: 750 * 1024 / 8, // 750 Kbps
      latency: 40 // 40ms
    });

    const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:19006';
    
    // Test key mobile screens
    await this.measurePageLoad(`${baseUrl}`, 'Mobile Home Screen');
    await this.measurePageLoad(`${baseUrl}/login`, 'Mobile Login Screen');
    await this.measurePageLoad(`${baseUrl}/onboarding`, 'Mobile Onboarding Screen');
  }

  async runDesktopPerformanceTest() {
    console.log('\n🖥️  Running Desktop Performance Tests...');
    
    // Reset to desktop viewport
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Reset network conditions
    await this.page.emulateNetworkConditions({
      offline: false,
      downloadThroughput: 10 * 1024 * 1024 / 8, // 10 Mbps
      uploadThroughput: 5 * 1024 * 1024 / 8, // 5 Mbps
      latency: 10 // 10ms
    });

    const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:19006';
    
    // Test key desktop screens
    await this.measurePageLoad(`${baseUrl}`, 'Desktop Home Screen');
    await this.measurePageLoad(`${baseUrl}/login`, 'Desktop Login Screen');
    await this.measurePageLoad(`${baseUrl}/admin`, 'Desktop Admin Panel');
  }

  async runStressTest() {
    console.log('\n🔥 Running Stress Tests...');
    
    const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:19006';
    
    // Rapid navigation test
    const pages = [
      `${baseUrl}`,
      `${baseUrl}/login`,
      `${baseUrl}/onboarding`
    ];

    for (let i = 0; i < 10; i++) {
      const randomPage = pages[Math.floor(Math.random() * pages.length)];
      await this.measurePageLoad(randomPage, `Stress Test ${i + 1}`);
      await this.page.waitForTimeout(500); // Brief pause between requests
    }
  }

  generateReport() {
    console.log('\n📊 Performance Test Report');
    console.log('=' .repeat(50));

    // Load Time Analysis
    if (this.results.loadTimes.length > 0) {
      const loadTimes = this.results.loadTimes.map(r => r.loadTime);
      const avgLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
      const maxLoadTime = Math.max(...loadTimes);
      const minLoadTime = Math.min(...loadTimes);

      console.log('\n🚀 Load Time Performance:');
      console.log(`   Average: ${Math.round(avgLoadTime)}ms`);
      console.log(`   Fastest: ${minLoadTime}ms`);
      console.log(`   Slowest: ${maxLoadTime}ms`);
      
      // Performance thresholds
      const goodThreshold = 2000; // 2 seconds
      const okThreshold = 4000; // 4 seconds
      
      if (avgLoadTime < goodThreshold) {
        console.log('   ✅ Performance: EXCELLENT');
      } else if (avgLoadTime < okThreshold) {
        console.log('   ⚠️  Performance: GOOD');
      } else {
        console.log('   ❌ Performance: NEEDS IMPROVEMENT');
      }
    }

    // Memory Usage Analysis
    const memoryResults = this.results.loadTimes
      .filter(r => r.memoryUsage)
      .map(r => r.memoryUsage.usedJSHeapSize);
    
    if (memoryResults.length > 0) {
      const avgMemory = memoryResults.reduce((a, b) => a + b, 0) / memoryResults.length;
      const maxMemory = Math.max(...memoryResults);
      
      console.log('\n🧠 Memory Usage:');
      console.log(`   Average: ${Math.round(avgMemory / 1024 / 1024)}MB`);
      console.log(`   Peak: ${Math.round(maxMemory / 1024 / 1024)}MB`);
      
      if (avgMemory < 50 * 1024 * 1024) { // 50MB
        console.log('   ✅ Memory Usage: EXCELLENT');
      } else if (avgMemory < 100 * 1024 * 1024) { // 100MB
        console.log('   ⚠️  Memory Usage: GOOD');
      } else {
        console.log('   ❌ Memory Usage: HIGH');
      }
    }

    // Network Requests Analysis
    if (this.results.networkRequests.length > 0) {
      const successfulRequests = this.results.networkRequests.filter(r => r.status < 400);
      const failedRequests = this.results.networkRequests.filter(r => r.status >= 400);
      
      console.log('\n🌐 Network Performance:');
      console.log(`   Total Requests: ${this.results.networkRequests.length}`);
      console.log(`   Successful: ${successfulRequests.length}`);
      console.log(`   Failed: ${failedRequests.length}`);
      
      if (failedRequests.length === 0) {
        console.log('   ✅ Network Reliability: EXCELLENT');
      } else if (failedRequests.length < this.results.networkRequests.length * 0.05) {
        console.log('   ⚠️  Network Reliability: GOOD');
      } else {
        console.log('   ❌ Network Reliability: POOR');
      }
    }

    // Errors Analysis
    if (this.results.errors.length > 0) {
      console.log('\n❌ Errors Encountered:');
      this.results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    } else {
      console.log('\n✅ No errors encountered during testing');
    }

    // Recommendations
    console.log('\n💡 Recommendations:');
    
    if (this.results.loadTimes.length > 0) {
      const avgLoadTime = this.results.loadTimes.reduce((sum, r) => sum + r.loadTime, 0) / this.results.loadTimes.length;
      
      if (avgLoadTime > 4000) {
        console.log('   • Optimize bundle size and implement code splitting');
        console.log('   • Enable compression and caching');
        console.log('   • Optimize images and assets');
      }
      
      if (avgLoadTime > 2000) {
        console.log('   • Consider implementing lazy loading');
        console.log('   • Minimize render-blocking resources');
      }
    }

    if (memoryResults.length > 0) {
      const avgMemory = memoryResults.reduce((a, b) => a + b, 0) / memoryResults.length;
      
      if (avgMemory > 100 * 1024 * 1024) {
        console.log('   • Review memory leaks and optimize component lifecycle');
        console.log('   • Implement virtual scrolling for large lists');
      }
    }

    if (this.results.errors.length > 0) {
      console.log('   • Fix console errors to improve user experience');
      console.log('   • Implement proper error boundaries');
    }

    return {
      summary: {
        totalTests: this.results.loadTimes.length,
        averageLoadTime: this.results.loadTimes.length > 0 ? 
          Math.round(this.results.loadTimes.reduce((sum, r) => sum + r.loadTime, 0) / this.results.loadTimes.length) : 0,
        totalErrors: this.results.errors.length,
        networkRequests: this.results.networkRequests.length
      },
      details: this.results
    };
  }
}

async function runPerformanceTests() {
  const tester = new PerformanceTest();
  
  try {
    await tester.setup();
    
    // Run different test suites
    await tester.runDesktopPerformanceTest();
    await tester.runMobilePerformanceTest();
    await tester.runStressTest();
    
    // Generate and display report
    const report = tester.generateReport();
    
    // Save report to file
    const fs = require('fs');
    const reportPath = './performance-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    // Exit with appropriate code
    if (report.summary.totalErrors > 0) {
      console.log('\n❌ Performance tests completed with errors');
      process.exit(1);
    } else {
      console.log('\n✅ Performance tests completed successfully');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Performance test suite failed:', error);
    process.exit(1);
  } finally {
    await tester.teardown();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runPerformanceTests();
}

module.exports = { PerformanceTest, runPerformanceTests };