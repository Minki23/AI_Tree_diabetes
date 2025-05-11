import React, { useCallback, useState } from 'react';
import {
  ReactFlowProvider,
  NodeProps,
  Controls,
  Background,
  MarkerType,
  Connection,
  Handle,
  Position,
  Panel
} from 'reactflow';
import ReactFlow, { Node, Edge as RfEdge, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css';
import { TreeNode, TreeNodeData } from '../types/types';

interface Props {
  onTreeChange: (nodes: TreeNode[], edges: RfEdge[]) => void;
}

// Obliczanie głębokości węzła
const getNodeDepth = (nodeId: string, edges: RfEdge[]): number => {
  const parentEdge = edges.find(e => e.target === nodeId);
  return parentEdge ? getNodeDepth(parentEdge.source, edges) + 1 : 0;
};

// Rekurencyjne zbieranie potomków
const getAllDescendants = (nodeId: string, edges: RfEdge[]): string[] => {
  const children = edges.filter(e => e.source === nodeId).map(e => e.target as string);
  return children.reduce((acc, child) => acc.concat(child, getAllDescendants(child, edges)), [] as string[]);
};

// --- Komponenty węzłów ---
function ConditionNode({ id, data }: NodeProps<TreeNodeData>) {
  return (
    <div className="p-4 bg-white border border-blue-300 rounded-lg shadow min-w-[200px]">
      <Handle type="target" position={Position.Top} />
      <div className="font-semibold text-blue-700 mb-2">{data.label}</div>
      <select
        className="w-full p-2 border rounded mb-2 text-black"
        value={data.condition?.column || ''}
        onChange={e => data.onUpdateNode(id, { ...data, condition: { ...data.condition!, column: e.target.value } })}
      >
        <option value="">Wybierz kolumnę</option>
        <option value="Glucose">Glukoza</option>
        <option value="BloodPressure">Ciśnienie krwi</option>
        <option value="SkinThickness">Grubość skóry</option>
        <option value="Insulin">Insulina</option>
        <option value="BMI">BMI</option>
        <option value="DiabetesPedigreeFunction">Rodzinne występowanie cukrzycy</option>
        <option value="Age">Wiek</option>
        <option value="Outcome">Wynik</option>
      </select>
      <div className="flex space-x-2 mb-2 text-black">
        <select
          className="flex-1 p-2 border rounded"
          value={data.condition?.operator || ''}
          onChange={e => data.onUpdateNode(id, { ...data, condition: { ...data.condition!, operator: e.target.value } })}
        >
          <option value=">">&gt;</option>
          <option value="<">&lt;</option>
          <option value=">=">&ge;</option>
          <option value="<=">&le;</option>
          <option value="==">=</option>
        </select>
        <input
          type="number"
          className="flex-1 p-2 border rounded"
          value={data.condition?.value || ''}
          onChange={e => data.onUpdateNode(id, { ...data, condition: { ...data.condition!, value: e.target.value } })}
        />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1">
        <button
          className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded"
          onClick={() => data.onAddChildNode(id, 'true')}
        >+ War. Prawda</button>
        <button
          className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded"
          onClick={() => data.onAddChildNode(id, 'false')}
        >+ War. Fałsz</button>
        <button
          className="px-2 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded"
          onClick={() => data.onAddChildResult?.(id, 'true', "true")}
        >+ Wyn. Prawda</button>
        <button
          className="px-2 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded"
          onClick={() => data.onAddChildResult?.(id, 'false', "true")}
        >+ Wyn. Fałsz</button>
        <button
          className="px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded col-span-2"
          onClick={() => data.onDeleteNode(id)}
        >Usuń</button>
      </div>
      <Handle type="source" position={Position.Bottom} id="true" style={{ left: '25%' }} />
      <Handle type="source" position={Position.Bottom} id="false" style={{ left: '75%' }} />
    </div>
  );
}

function ResultNode({ id, data }: NodeProps<TreeNodeData>) {
  return (
    <div className="p-4 bg-white border border-green-300 rounded-lg shadow min-w-[150px]">
      <Handle type="target" position={Position.Top} />
      <div className="font-semibold text-green-700 mb-2">Wynik</div>

      <div className="mb-2">
        <select
          className="w-full p-2 border rounded text-black"
          value={data.label}
          onChange={e => {
              data.label = e.target.value;
              data.results = e.target.value;
              data.onUpdateNode(id, { ...data, results: e.target.value })
            }
          }
        >
          <option value="1">Cukrzyca</option>
          <option value="0">Brak cukrzycy</option>
        </select>
      </div>

      <button
        className="mt-2 w-full px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded"
        onClick={() => data.onDeleteNode(id)}
      >
        Usuń
      </button>
    </div>
  );
}

const nodeTypes = { condition: ConditionNode, result: ResultNode };

const initialNodes: Node<TreeNodeData>[] = [
  {
    id: 'root',
    type: 'condition',
    position: { x: 300, y: 50 },
    data: {
      label: 'Korzeń',
      type: 'condition',
      condition: { column: '', operator: '>', value: '0' },
      onUpdateNode: () => {},
      onAddChildNode: () => {},
      onAddChildResult: () => {},
      onDeleteNode: () => {}
    }
  }
];

const DecisionTreeBuilder = ({ onTreeChange }: Props) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<TreeNodeData>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<RfEdge[]>([]);
  const [nextId, setNextId] = useState(1);

  const enriched = nodes.map(n => ({ ...n, data: { ...n.data, onUpdateNode, onAddChildNode, onAddChildResult, onDeleteNode } }));

  function onUpdateNode(id: string, data: TreeNodeData) {
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data } : n));
    setTimeout(updateModel, 1000);
  }

  function onAddChildNode(parentId: string, label: 'true' | 'false') {
    addNode(parentId, label, "0", 'condition');
  }

  function onAddChildResult(parentId: string, label: 'true' | 'false', result: string) {
    addNode(parentId, label, result, 'result');
  }

  function addNode(parentId: string, label: 'true' | 'false', result: string, type: 'condition' | 'result') {
    const parent = nodes.find(n => n.id === parentId);
    if (!parent) return;
    if (edges.some(e => e.source === parentId && e.sourceHandle === label)) return;
    const newId = `node_${nextId}`;
    setNextId(i => i + 1);
    const depth = getNodeDepth(parentId, edges) + 1;
    const position = { x: parent.position.x + (label === 'true' ? -200 : 200), y: 50 + depth * 150 };
    const baseData: Omit<TreeNodeData, 'onUpdateNode' | 'onAddChildNode' | 'onAddChildResult' | 'onDeleteNode'> =
      type === 'condition'
        ? { label: 'Warunek', type: 'condition', condition: { column: '', operator: '>', value: '0' } }
        : { label: 'Wynik', type: 'result', results: result };
    const newNode: Node<TreeNodeData> = {
      id: newId,
      type,
      position,
      data: {
        ...baseData,
        onUpdateNode,
        onAddChildNode,
        onAddChildResult,
        onDeleteNode
      }
    };
    const newEdge: RfEdge = {
      id: `e${parentId}-${newId}`,
      source: parentId,
      sourceHandle: label,
      target: newId,
      markerEnd: { type: MarkerType.ArrowClosed }
    };
    setNodes(nds => [...nds, newNode]);
    setEdges(eds => [...eds, newEdge]);
    setTimeout(updateModel, 1000);
  }

  function onDeleteNode(id: string) {
    if (id === 'root') return;
    const toRemove = [id, ...getAllDescendants(id, edges)];
    setEdges(eds => eds.filter(e => !toRemove.includes(e.source) && !toRemove.includes(e.target)));
    setNodes(nds => nds.filter(n => !toRemove.includes(n.id)));
    setTimeout(updateModel, 1000);
  }

  const onConnect = useCallback(() => {}, []);

  const updateModel = useCallback(() => {
    const tree: TreeNode[] = nodes.map(n => ({
      id: n.id,
      data: {
        type: n.data.type,
        label: n.data.label,
        condition: n.data.condition,
        results: n.data.results
      },
      children: edges.filter(e => e.source === n.id).map(e => e.target as string)
    }));
    onTreeChange(tree, edges);
  }, [nodes, edges, onTreeChange]);

  return (
    <ReactFlowProvider>
      <div className="w-full h-[80vh] bg-white rounded shadow">
        <ReactFlow
          nodes={enriched}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <Panel position="top-right" className="bg-white p-2 rounded shadow-md z-10">
            <button
              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
              onClick={updateModel}
            >
              Zapisz drzewo
            </button>
          </Panel>
          <Background gap={16} />
        </ReactFlow>
      </div>
    </ReactFlowProvider>
  );
};

export default DecisionTreeBuilder;
