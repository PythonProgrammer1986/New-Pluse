import fs from 'fs';
import path from 'path';
import { convertOperationalDataToAppState } from '../src/linkOperationalDataset';
import { INITIAL_STATE } from '../src/seedData';

async function main() {
  const inputPath = path.join(process.cwd(), 'public/assets/aistudio/File_to_link_732fbf8e.json');
  const outputPath = path.join(process.cwd(), 'public/converted_daily_pulse_new_format.json');

  console.log('Reading input JSON from:', inputPath);
  const rawData = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

  console.log('Converting old daily pulse format to new pulse AppState format...');
  const newFormat = convertOperationalDataToAppState(rawData, INITIAL_STATE);

  console.log('Writing converted JSON to:', outputPath);
  fs.writeFileSync(outputPath, JSON.stringify(newFormat, null, 2), 'utf-8');

  console.log('Conversion successful!');
  console.log('Summary of converted dataset:');
  console.log('- Projects in Matrix:', newFormat.projectMatrices?.length);
  console.log('- Action Items:', newFormat.actionItems?.length);
  console.log('- Employees:', newFormat.employees?.length);
  console.log('- Time Bookings:', newFormat.timeBookings?.length);
  console.log('- Daily Widgets:', newFormat.widgets?.length);
}

main().catch((err) => {
  console.error('Conversion failed:', err);
  process.exit(1);
});
