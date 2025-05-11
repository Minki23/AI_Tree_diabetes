import { NextApiRequest, NextApiResponse } from 'next';
import { TreeNode, PatientData } from '../../types/types';

const evaluateTree = (nodes: TreeNode[], patient: PatientData): number => {
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
    const patientValue = patient[column];
    
    const conditionMet = {
      '>': () => patientValue > value,
      '<': () => patientValue < value,
      '>=': () => patientValue >= value,
    }[operator as '>' | '<' | '>=']();

    return evaluateNode(conditionMet ? node.children![0] : node.children![1]);
  };

  return evaluateNode(nodes[0].id); // Zakładamy że pierwszy node to korzeń
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { nodes, data }: { nodes: TreeNode[]; data: PatientData[] } = req.body;
  
  try {
    const correct = data.filter(patient => 
      evaluateTree(nodes, patient) === patient.outcome
    ).length;

    const accuracy = Number((correct / data.length * 100).toFixed(2));
    res.status(200).json({ accuracy });
    
  } catch (error) {
    console.error('Evaluation error:', error);
    res.status(500).json({ error: 'Błąd ewaluacji drzewa' });
  }
}