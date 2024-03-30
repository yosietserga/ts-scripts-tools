import { promises as fs } from 'fs';
import * as path from 'path';
import {minimatch} from 'minimatch';

// Asynchronously parse a file to find its dependencies
export async function findDependencies(filePath: string): Promise<string[]> {
  const content = await fs.readFile(filePath, 'utf8');
  const regex = /require\(['"`](.+?)['"`]\)/g;
  const dependencies: string[] = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    dependencies.push(match[1]);
  }

  return dependencies/*.filter(dep => !dep.startsWith('.'));*/
}

export async function buildWorkflowRoadmap(startFile: string, ignoreFilters: string[] = []): Promise<Map<string, string[]>> {
  const roadmap = new Map<string, string[]>();

  async function traverse(filePath: string, basePath: string = '', depth: number = 0): Promise<void> {
    const absolutePath = path.resolve(basePath, filePath);

    // Skip if the file or its directory should be ignored
    if (ignoreFilters.some(filter => minimatch(absolutePath, `**/${filter}/**`))) {
      return;
    }

    const dependencies = await findDependencies(absolutePath);

    if (!roadmap.has(absolutePath)) {
      roadmap.set(absolutePath, dependencies);
      for (const dep of dependencies) {
        if (dep.startsWith('.')) {
          const depPath = path.resolve(path.dirname(absolutePath), dep);
          try {
            const resolvedPath = require.resolve(depPath);
            await traverse(resolvedPath, path.dirname(filePath), depth + 1);
          } catch (error) {
            console.error(`Error resolving ${depPath}:`, error);
          }
        }
      }
    }
  }

  await traverse(startFile);
  return roadmap;
}

// New function to print the roadmap in a hierarchical tree format
export function printRoadmap(roadmap: Map<string, string[]>, startFile: string, ignoreFilters: string[] = []): void {
  function print(filePath: string, depth: number = 0): void {
    const spaces = ' '.repeat(depth * 2);
    console.log(`${spaces}- ${path.basename(filePath)}`);

    const dependencies = roadmap.get(filePath);
    if (dependencies) {
      for (const dep of dependencies) {
        if (dep.startsWith('.')) {
          const depPath = path.resolve(path.dirname(filePath), dep);
          try {
            const resolvedPath = require.resolve(depPath);
            if (!ignoreFilters.some(filter => minimatch(resolvedPath, `**/${filter}/**`))) {
              print(resolvedPath, depth + 1);
            }
          } catch (error) {
            console.error(`Error resolving ${depPath}:`, error);
          }
        }
      }
    }
  }

  const startPath = path.resolve(startFile);
  print(startPath);
}


/**
 //example of usage 
import { buildWorkflowRoadmap, printRoadmap } from './dependencyParser';

const startFile: string = './index.js'; // Adjust this path to your CLI's entry point
const ignoreFilters: string[] = ['node_modules']; // Add more directories to ignore as needed

buildWorkflowRoadmap(startFile, ignoreFilters)
  .then(roadmap => {
    printRoadmap(roadmap, startFile, ignoreFilters);
  })
  .catch(console.error);
 */
