import fs from 'fs';
import path from 'path';
import { TrendAnalyzer } from '../src/lib/trend/trend-analyzer';

const main = async () => {
  const analyzer = new TrendAnalyzer();
  const date = '2026-01-24';

  console.log(`Generating trend report for ${date}...`);
  const report = analyzer.generateDailyReport(date);

  const outputPath = path.join(process.cwd(), 'trend_report_20260124.json');

  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`Report generated successfully at: ${outputPath}`);
};

main().catch(err => {
  console.error('Failed to generate report:', err);
  process.exit(1);
});
