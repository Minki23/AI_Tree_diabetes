import { useState, useEffect } from 'react';
import { PatientData } from '../types/types';

interface NodeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (nodeData: any) => void;
  initialData?: any;
  patientData: PatientData[];
  isRootNode?: boolean;
}

const NodeEditorModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData, 
  patientData,
  isRootNode = false 
}: NodeEditorModalProps) => {
  const [nodeType, setNodeType] = useState<'condition' | 'result'>(initialData?.type || 'condition');
  const [condition, setCondition] = useState({
    column: initialData?.condition?.column || 'glucose',
    operator: initialData?.condition?.operator || '>',
    value: initialData?.condition?.value || 0
  });
  const [results, setResults] = useState({
    diabetic: initialData?.results?.diabetic || 0,
    nonDiabetic: initialData?.results?.nonDiabetic || 0
  });

  // Reset form when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      setNodeType(initialData?.type || 'condition');
      setCondition({
        column: initialData?.condition?.column || 'glucose',
        operator: initialData?.condition?.operator || '>',
        value: initialData?.condition?.value || 0
      });
      setResults({
        diabetic: initialData?.results?.diabetic || 0,
        nonDiabetic: initialData?.results?.nonDiabetic || 0
      });
    }
  }, [isOpen, initialData]);

  const handleSave = () => {
    const nodeData = {
      type: nodeType,
      condition: nodeType === 'condition' ? condition : undefined,
      results: nodeType === 'result' ? results : undefined,
      label: nodeType === 'condition' 
        ? `${condition.column} ${condition.operator} ${condition.value}`
        : `Diabetic: ${results.diabetic}, Non-Diabetic: ${results.nonDiabetic}`
    };
    
    onSave(nodeData);
    onClose();
  };

  if (!isOpen) return null;

  // Extract unique column names from patient data
  const columns = patientData.length > 0 
    ? Object.keys(patientData[0]).filter(col => col !== 'outcome' && col !== 'id')
    : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">
          {initialData ? 'Edytuj węzeł' : 'Dodaj nowy węzeł'}
        </h2>
        
        {!isRootNode && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Typ węzła</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="condition"
                  checked={nodeType === 'condition'}
                  onChange={() => setNodeType('condition')}
                  className="mr-2"
                />
                Warunek
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="result"
                  checked={nodeType === 'result'}
                  onChange={() => setNodeType('result')}
                  className="mr-2"
                />
                Wynik
              </label>
            </div>
          </div>
        )}
        
        {(nodeType === 'condition' || isRootNode) && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Parametr</label>
              <select
                value={condition.column}
                onChange={(e) => setCondition({...condition, column: e.target.value})}
                className="w-full p-2 border rounded"
              >
                {columns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Operator</label>
              <select
                value={condition.operator}
                onChange={(e) => setCondition({...condition, operator: e.target.value as '>' | '<' | '>='})}
                className="w-full p-2 border rounded"
              >
                <option value=">">większe niż (&gt;)</option>
                <option value="<">mniejsze niż (&lt;)</option>
                <option value=">=">większe lub równe (&gt;=)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Wartość</label>
              <input
                type="number"
                value={condition.value}
                onChange={(e) => setCondition({...condition, value: parseFloat(e.target.value)})}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        )}
        
        {nodeType === 'result' && !isRootNode && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Pacjenci z cukrzycą</label>
              <input
                type="number"
                value={results.diabetic}
                onChange={(e) => setResults({...results, diabetic: parseInt(e.target.value)})}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Pacjenci bez cukrzycy</label>
              <input
                type="number"
                value={results.nonDiabetic}
                onChange={(e) => setResults({...results, nonDiabetic: parseInt(e.target.value)})}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        )}
        
        <div className="flex justify-end gap-2 mt-6">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border rounded hover:bg-gray-100"
          >
            Anuluj
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Zapisz
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodeEditorModal;