// utils/treeEvaluation.ts
import { PatientData, TreeNode } from '../types/types';
import { Edge } from 'reactflow';

/**
 * Evaluates a patient against a decision tree
 * @returns 1 for diabetes prediction, 0 for no diabetes
 */
export const evaluateTree = (nodes: TreeNode[], patient: PatientData): number => {
  // Get all edges from node data
  const edges: Edge[] = [];
  nodes.forEach(node => {
    if (node.children) {
      node.children.forEach((childId, index) => {
        edges.push({
          id: `e${node.id}-${childId}`,
          source: node.id,
          target: childId,
          // For simplicity, assume first child is "true" branch, second is "false"
          label: index === 0 ? 'Tak' : 'Nie'
        });
      });
    }
  });

  const findNode = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) throw new Error(`Node ${nodeId} not found`);
    return node;
  };

  const evaluateNode = (nodeId: string): number => {
    const node = findNode(nodeId);
    
    if (node.data.type === 'result') {
        return node.data.results == "diabetic" ? 1 : 0;
    }

    const { column, operator, value } = node.data.condition!;
    const patientValue = patient[column as keyof PatientData];
    
    if (typeof patientValue !== 'number') {
      throw new Error(`Patient value for ${column} is not a number`);
    }
    
    const validOperators = {
      '>': () => patientValue > Number(value),
      '<': () => patientValue < Number(value),
      '>=': () => patientValue >= Number(value),
    } as const;

    if (!(operator in validOperators)) {
      throw new Error(`Invalid operator: ${operator}`);
    }

    const conditionMet = validOperators[operator as keyof typeof validOperators]();

    // Find connected nodes
    const connectedEdges = edges.filter(e => e.source === nodeId);
    
    // Find the edge corresponding to condition outcome (true/false)
    const edge = conditionMet 
      ? connectedEdges.find(e => e.label === 'Tak') 
      : connectedEdges.find(e => e.label === 'Nie');
    
    if (!edge) {
      throw new Error(`No ${conditionMet ? 'true' : 'false'} branch found for node ${nodeId}`);
    }
    
    return evaluateNode(edge.target);
  };

  // Start evaluation from the root node (for simplicity assume it's the first node)
  return evaluateNode(nodes[0].id);
};