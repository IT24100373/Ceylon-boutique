const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, '../src/screens');
const outputFile = path.join(__dirname, '../screens_prompts.md');

// Utility to extract matches safely
const extractMatches = (regex, content, groupIndex = 1) => {
  const matches = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (match[groupIndex] && match[groupIndex].trim() !== '') {
      matches.push(match[groupIndex].trim());
    }
  }
  return [...new Set(matches)]; // Return unique values
};

function analyzeScreen(filePath, fileName) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const screenName = fileName.replace('.js', '');

  // Extract custom UI components
  // Look for Capitalized JSX tags like <Button, <InputField
  const componentRegex = /<([A-Z][a-zA-Z0-9]*)/g;
  let componentsMatch = extractMatches(componentRegex, content, 1);
  const coreRNComponents = ['View', 'Text', 'ScrollView', 'SafeAreaView', 'TouchableOpacity', 'Image', 'FlatList', 'KeyboardAvoidingView', 'StyleSheet', 'ActivityIndicator', 'TextInput'];
  const customComponents = componentsMatch.filter(c => !coreRNComponents.includes(c));

  // Extract Navigation actions
  const navRegex = /navigation\.navigate\(['"]([^'"]+)['"]/g;
  const navigations = extractMatches(navRegex, content, 1);

  // Extract Context / Hooks
  const hooksRegex = /(use[A-Z][a-zA-Z0-9]*)\(/g;
  const hooks = extractMatches(hooksRegex, content, 1);

  // Extract Text / Data displayed
  // Very simplistic: match text inside <Text>...</Text> that doesn't have nested tags
  const textRegex = /<Text[^>]*>([^<]+)<\/Text>/g;
  const staticText = extractMatches(textRegex, content, 1).filter(t => !t.includes('{'));
  const dynamicData = extractMatches(textRegex, content, 1).filter(t => t.includes('{')).map(t => t.replace(/[{}]/g, ''));

  return {
    screenName,
    customComponents,
    navigations,
    hooks,
    staticText,
    dynamicData
  };
}

function generatePrompt(data) {
  let prompt = `### ${data.screenName}\n\n`;
  prompt += `**Purpose:**\nThis screen serves as the ${data.screenName.replace('Screen', '')} interface within the app.\n\n`;
  
  prompt += `**UI Components:**\n`;
  prompt += `- Standard Elements: Uses core React Native layout and interactive components.\n`;
  if (data.customComponents.length > 0) {
    prompt += `- Custom Components: Employs \`${data.customComponents.join('`, `')}\`.\n`;
  } else {
    prompt += `- Custom Components: None detected.\n`;
  }

  prompt += `\n**Features & Data Flow:**\n`;
  if (data.hooks.length > 0) {
    prompt += `- Utilizes hooks/contexts: \`${data.hooks.join('`, `')}\` for state management and functional logic.\n`;
  }
  if (data.dynamicData.length > 0) {
    prompt += `- Displays dynamic data such as: \`${data.dynamicData.join('`, `')}\`.\n`;
  }
  
  prompt += `\n**User Interactions:**\n`;
  if (data.navigations.length > 0) {
    prompt += `- Supports navigation to: \`${data.navigations.join('`, `')}\`.\n`;
  } else {
    prompt += `- Handles standard user input flows, but no explicit static navigations detected.\n`;
  }

  prompt += `\n**Relevant Static Content Labels:**\n`;
  if (data.staticText.length > 0) {
    // Only show up to 5 static labels to avoid noise
    prompt += `- ${data.staticText.slice(0, 5).join(', ')}${data.staticText.length > 5 ? '...' : ''}\n`;
  } else {
    prompt += `- Minimal explicit static text.\n`;
  }

  prompt += `\n---\n`;
  return prompt;
}

function main() {
  if (!fs.existsSync(screensDir)) {
    console.error(`Screens directory not found: ${screensDir}`);
    return;
  }

  const files = fs.readdirSync(screensDir).filter(f => f.endsWith('.js'));
  console.log(`Found ${files.length} screens. Processing...`);

  let finalMarkdown = `# Mobile App Screen Prompts (for Google Stitch)\n\n`;
  finalMarkdown += `This document contains the prompt generation for all screen templates in the React Native app. It outlines the purpose, components, interactions, and data requirements for each screen.\n\n---\n\n`;

  files.forEach(file => {
    const filePath = path.join(screensDir, file);
    try {
      const screenData = analyzeScreen(filePath, file);
      const screenPrompt = generatePrompt(screenData);
      finalMarkdown += screenPrompt + '\n';
    } catch (err) {
      console.error(`Error analyzing ${file}:`, err.message);
    }
  });

  fs.writeFileSync(outputFile, finalMarkdown, 'utf-8');
  console.log(`Successfully generated prompts for ${files.length} screens in ${outputFile}`);
}

main();
