'use client';

import { useState } from 'react';
import DataLoader from './components/DataLoader';
import DecisionTreeBuilder from './components/DecisionTreeBuilder';
import AccuracyEvaluation from './components/AccuracyEvaluation';
import { PatientData, TreeNode } from './types/types';
import { SparklesIcon, BeakerIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { Edge } from 'reactflow';

export default function HomePage() {
  const [medicalData] = useState<PatientData[]>([]);
  const [treeNodes, setTreeNodes] = useState<TreeNode[]>([]);
  const [treeEdges, setTreeEdges] = useState<Edge[]>([]);

  const handleTreeChange = (nodes: TreeNode[], edges: Edge[]) => {
    setTreeNodes(nodes);
    setTreeEdges(edges);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      <section className="bg-white rounded-xl p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <SparklesIcon className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-semibold text-gray-800">Krok 1: Analiza danych</h2>
        </div>
        <DataLoader/>
      </section>

        <>  
          <section className="bg-white rounded-xl p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <BeakerIcon className="h-8 w-8 text-green-600" />
              <h2 className="text-2xl font-semibold text-gray-800">Krok 2: Budowanie własnego drzewa decyzyjnego</h2>
            </div>
            <DecisionTreeBuilder onTreeChange={handleTreeChange} />
          </section>

          <section className="bg-white rounded-xl p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
              <h2 className="text-2xl font-semibold text-gray-800">Krok 3: Ocena dokładności stworzonego drzewa</h2>
            </div>
            <AccuracyEvaluation nodes={treeNodes} edges={treeEdges} data={medicalData} />
          </section>
        </>
    </div>
  );
}