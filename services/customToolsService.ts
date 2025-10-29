/**
 * Custom Tools Service
 * Manages user-created dynamic tools
 */

export interface CustomTool {
  id: string;
  name: string;
  description: string;
  category: 'analysis' | 'news' | 'technical' | 'fundamental';
  prompt: string;
  visualType: 'text' | 'divergence' | 'ghost' | 'options' | 'chart';
  sampleData?: any;
  createdAt: number;
}

const STORAGE_KEY = 'stockbrain_custom_tools';

/**
 * Get all custom tools from localStorage
 */
export function getCustomTools(): CustomTool[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load custom tools:', error);
    return [];
  }
}

/**
 * Save a new custom tool
 */
export function saveCustomTool(tool: CustomTool): void {
  try {
    const tools = getCustomTools();
    const updatedTools = [tool, ...tools];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTools));
  } catch (error) {
    console.error('Failed to save custom tool:', error);
    throw error;
  }
}

/**
 * Delete a custom tool by ID
 */
export function deleteCustomTool(id: string): void {
  try {
    const tools = getCustomTools();
    const filtered = tools.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to delete custom tool:', error);
    throw error;
  }
}

/**
 * Generate a tool using AI
 */
export async function generateTool(description: string): Promise<CustomTool> {
  const response = await fetch('/api/generate-tool', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate tool');
  }

  const data = await response.json();
  const tool: CustomTool = {
    ...data.tool,
    createdAt: Date.now(),
  };

  // Save to localStorage
  saveCustomTool(tool);

  return tool;
}

/**
 * Get tool category icon
 */
export function getToolCategoryIcon(category: CustomTool['category']): string {
  switch (category) {
    case 'analysis':
      return 'chart';
    case 'news':
      return 'newspaper';
    case 'technical':
      return 'chart-line';
    case 'fundamental':
      return 'calculator';
    default:
      return 'tool';
  }
}

/**
 * Get tool category color
 */
export function getToolCategoryColor(category: CustomTool['category']): string {
  switch (category) {
    case 'analysis':
      return 'text-blue-400';
    case 'news':
      return 'text-green-400';
    case 'technical':
      return 'text-purple-400';
    case 'fundamental':
      return 'text-yellow-400';
    default:
      return 'text-gray-400';
  }
}
