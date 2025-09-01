import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  const templatePath = join(__dirname, '../dist/template.json');
  const template = JSON.parse(readFileSync(templatePath, 'utf8'));
  
  const outputs = template.Outputs || {};
  const result = {};
  
  Object.keys(outputs).forEach(key => {
    result[key] = outputs[key].Export?.Name || outputs[key].Value;
  });
  
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error('Error reading CDK outputs:', error);
  process.exit(1);
}


