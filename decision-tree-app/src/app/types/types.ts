// types.ts
export interface PatientData {
  [key: string]: number | string; // General index signature
  glucose: number;
  bloodPressure: number;
  skinThickness: number;
  insulin: number;
  bmi: number;
  diabetesPedigree: number;
  age: number;
  outcome: number; // 1 for diabetes, 0 for no diabetes
}

export interface DataStats {
  total: number;
  valid: number;
  invalid: number;
}

export interface TreeNodeCondition {
  column: string;
  operator: '>' | '<' | '>=';
  value: number;
}

export interface TreeNodeResult {
  diabetic: number;
  nonDiabetic: number;
}

// types.ts
export interface Condition {
  column: string;
  operator: string;
  value: string;
}

export interface Results {
  diabetic: number;
  nonDiabetic: number;
}

export interface TreeNodeData {
  label: string;
  type: 'condition' | 'result';
  condition?: {
    column: string;
    operator: string;
    value: string;
  };
  results?: string;
  onUpdateNode: (id: string, data: TreeNodeData) => void;
  onAddChildNode: (parentId: string, label: 'true' | 'false') => void;
  onAddChildResult?: (parentId: string, label: 'true' | 'false', result: string) => void;
  onDeleteNode: (id: string) => void;
}

export interface TreeNode {
  id: string;
  data: Omit<TreeNodeData, 'onUpdateNode' | 'onAddChildNode' | 'onDeleteNode'>;
  children: string[];
}

export interface Edge {
  source: string;
  target: string;
  label?: string;
}

